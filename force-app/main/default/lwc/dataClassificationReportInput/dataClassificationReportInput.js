import {LightningElement, track} from 'lwc';
import getMetadataForValues from '@salesforce/apex/DataClassificationReportController.getMetaDataForValues';
import getMetadataForOptions from '@salesforce/apex/DataClassificationReportController.getEntitiesForInput';
import saveMetadata from '@salesforce/apex/DataClassificationReportController.saveMetaValues';
import getOmittedMetadata from '@salesforce/apex/DataClassificationReportController.getMetaDataForOmittedValues';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';

/**
 * The Javascript controller for the DataClassificationReportInput LWC, responsible for populating the table with data
 * and reacting to UI selections (including a save of the currently selected data to the Data Classification record).
 */
export default class DataClassificationReportInput extends LightningElement {
	/** Column set for the Omitted Fields data table. */
	columns = [{label: 'Name', fieldName: 'name', type: 'text'},];
	/** Toggle for the loading spinner for use during heavy data processing. */
	loading = false;

	/** Array of omitted fields. */
	@track omittedList = [];
	/** Array of available Salesforce entities. */
	@track options;
	/** Array of selected Salesforce entities. */
	@track selectedEntityNames = [];

	/**
	 * On insertion of this LWC into the page, shows the spinner until the table data is loaded.
	 */
	connectedCallback() {
		this.loading = true;
		this.loadInputTableData()
			.then(() => {
				this.loading = false;
			})
			.catch((error) => {
				this.error = error;
			});
	}

	/**
	 * Calls a set of async methods in parallel to populate table data, then confirms the completion of the full set.
	 * @returns {Promise<void>}
	 */
	async loadInputTableData(){
		let availableEntitiesResult = this.getEntities();
		let selectedEntitiesResult = this.getSelectedEntities();
		let omittedFieldsResult = this.getOmittedFields();
		await Promise.all([availableEntitiesResult,selectedEntitiesResult,omittedFieldsResult]);
	}


	/**
	 * Builds the full list of options to initialize the Select Entity dual list box.
	 * @returns {Promise<void>}
	 */
	async getEntities() {
		const fullEntityListJSON = await getMetadataForOptions();
		const fullEntityList = JSON.parse(fullEntityListJSON).sort();
		let tempOptionList = [];

		for (let entListIndex = 0; entListIndex < fullEntityList.length; entListIndex++) {
			const currEntityName = fullEntityList[entListIndex];
			tempOptionList.push({
				label: currEntityName, value: currEntityName
			})
		}

		this.options = tempOptionList;
	}

	/**
	 * Builds the list of selected options to initialize the Select Entity dual list box.
	 * @returns {Promise<void>}
	 */
	async getSelectedEntities() {
		const selectedEntityListJSON = await getMetadataForValues();

		/*
		 JS JSON.stringify adds quotes around strings on save, while Apex's JSON.serialize escapes those quote marks.
		 This results in a parameter like "[\"Account\"]". Clean it up to look like ["Account"] to enable JSON.parse().
		 */
		this.selectedEntityNames = JSON.parse(selectedEntityListJSON.replaceAll('\\', '').slice(1, -1));
	}

	/**
	 * Builds the list of omitted field names to initialize the Omitted Fields data table.
	 * @returns {Promise<void>}
	 */
	async getOmittedFields() {
		const omittedFieldJSON = await getOmittedMetadata();
		const omitFieldsList = JSON.parse(omittedFieldJSON.replaceAll('\\', '').slice(1, -1));
		let tempOptionList = [];
		for (let omitListIndex = 0; omitListIndex < omitFieldsList.length; omitListIndex++) {
			tempOptionList.push({
				name: omitFieldsList[omitListIndex]
			})
		}
		this.omittedList = tempOptionList;
	}

	/**
	 * Adds any valid user-entered omitted field name as a new row in the Omitted Fields table.
	 */
	handleAddOmittedField() {
		let omittedFieldInput = this.template.querySelector('[data-id=OmittedField]');
		const omittedFieldName = omittedFieldInput.value;
		omittedFieldInput.value = '';

		if (this.validateField(omittedFieldName)) {
			this.omittedList.push({name: omittedFieldName});
		}

		this.omittedList = this.omittedList.sort();
	}

	/**
	 * Removes all selected fields from the Omitted Fields table.
	 */
	handleRemoveOmittedFields() {
		let omittedFieldTable = this.template.querySelector('[data-id=omittedTable]');
		const selectedOmittedTableRows = omittedFieldTable.getSelectedRows();
		omittedFieldTable.selectedRows = [];

		let selectedFieldNames = [];
		for (let rowIndex = 0; rowIndex < selectedOmittedTableRows.length; rowIndex++) {
			selectedFieldNames.push(selectedOmittedTableRows[rowIndex].name);
		}

		for (let oListIndex = this.omittedList.length - 1; oListIndex >= 0; oListIndex--) {
			if (selectedFieldNames.indexOf(this.omittedList[oListIndex].name) !== -1) {
				this.omittedList.splice(oListIndex, 1);
			}
		}

		// Array methods do not invoke a refresh of components via the standard @track flow, so just reassign.
		this.omittedList = [...this.omittedList];
	}

	/**
	 * Converts the current settings to JSON strings and sends them to an Apex Controller method for storage on the
	 * default Data Classification record.
	 */
	handleSave() {
		const omittedFields = JSON.stringify(this.getOmittedFieldNames().sort());
		const reportableEntities = JSON.stringify(this.selectedEntityNames.sort());
		const metadataFieldNames = ['Omitted_Fields__c', 'reportable_entity_json__c'];
		const metadataFieldValues = [omittedFields, reportableEntities];

		saveMetadata({fieldNameList: metadataFieldNames, fieldValueList: metadataFieldValues})
			.then(() => {
				const event = new ShowToastEvent({
					title: 'Successfully Saved', message: 'Your settings have been saved.', variant: 'success',
				});
				this.dispatchEvent(event);
			})
			.catch((error) => {
				const event = new ShowToastEvent({
					title: 'Failed to Save', message: JSON.stringify(error), variant: 'error',
				});
				this.dispatchEvent(event);
			});
	}

	/**
	 * Iterates over the list of omitted fields to generate and return a list of their names.
	 * @returns {string[]} A list of the omitted field names.
	 */
	getOmittedFieldNames() {
		let returnList = [];
		for (let oListIndex = 0; oListIndex < this.omittedList.length; oListIndex++) {
			returnList.push(this.omittedList[oListIndex].name);
		}

		return returnList;
	}

	/**
	 * Automatically selects entities in the dual list box based on current selection status and the button pressed.
	 * @param event An event fired on click of a 'Select [] Objects' button.
	 */
	handleSelect(event) {
		const handle = event.target.label;

		for (let optsIndex = 0; optsIndex < this.options.length; optsIndex++){
			let currOptLabel = this.options[optsIndex].label;

			// Option already selected, don't select it again.
			if (!this.checkMetadataStoredValues(currOptLabel)){
				continue;
			}

			if (handle === 'Select Standard Objects' && !currOptLabel.includes('__') ||
				handle === 'Select Custom Objects' && currOptLabel.includes('__c')) {
				this.selectedEntityNames.push(currOptLabel);
			}
		}

		this.selectedEntityNames = this.selectedEntityNames.sort();
	}

	/**
	 * Validates that a string of user-entered text satisfies Salesforce's field API naming restrictions and isn't
	 * already present in the table of omitted fields.
	 * @param {string} newFieldAPIName A string of user-entered text representing a Salesforce field API name.
	 * @returns {boolean} True/False, whether the field is valid for addition to the omitted fields list.
	 */
	validateField(newFieldAPIName) {
		//TODO: Implement a full regex for Salesforce field name.
		if (newFieldAPIName === undefined || newFieldAPIName === '') {
			const event = new ShowToastEvent({
				title: 'Invalid Field Name',
				message: 'Omitted Field must follow Salesforce field naming conventions.',
				variant: 'error',
			});
			this.dispatchEvent(event);
			return false;
		}

		for (const field in this.omittedList) {
			if (field.name === newFieldAPIName) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Validates that an object entity API name is among the names of entities currently selected for reporting.
	 * @param {string} name The qualified API name of a Salesforce object entity.
	 * @returns {boolean} True/False, whether the given entity's name is among those currently selected.
	 */
	checkMetadataStoredValues(name) {
		return (this.selectedEntityNames.indexOf(name) === -1);
	}

	/**
	 * Synchronizes the selected items in the entities dual list box on any movement from available to selected.
	 * @param event An event fired on moving items from side to side in a dual list box LWC.
	 */
	handleSelectedEntitiesChange(event) {
		this.selectedEntityNames = event.detail.value;
	}
}