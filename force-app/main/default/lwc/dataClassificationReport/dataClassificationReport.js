import {LightningElement, track} from 'lwc';
import getEntityData from '@salesforce/apex/DataClassificationReportController.getEntityData';
import getEntityNames from '@salesforce/apex/DataClassificationReportController.getEntities';
import {exportCSV} from 'c/exportUtil';

const actions = [
	{label: 'View Details', name: 'view', sortable: "true"},
];
const columns = [
	{label: 'Metadata Name', fieldName: 'name', sortable: "true", initialWidth: 195},
	{label: 'Total Fields', fieldName: 'fieldCount', sortable: "true", initialWidth: 155},
	{label: 'Unclassified', fieldName: 'unclassified', sortable: "true", initialWidth: 155},
	{label: 'No Compliance Group', fieldName: 'cGroup', sortable: "true", initialWidth: 155},
	{
		type: 'action', typeAttributes:
			{
				rowActions: actions,
				menuAlignment: 'right'
			}
	},
];
const findColumns = [
	{label: 'Metadata Name', fieldName: 'name', sortable: "true", initialWidth: 220},
];

export default class DataClassificationReport extends LightningElement {
	columns = columns;
	//this holds info for the datatable
	@track objectList = [];
	findOptions = [];
	findData = [];
	findColumns = findColumns;
	loading = false;
	finalLoadCount;
	currentLoadCount;
	comboBoxFilter;
	showFindTable = false;
	showExport = false;
	activeSections = []; //this controls which sections are expanded
	csvData = [];
	sfdcBaseURL = window.location.origin;

	@track sortBy;
	@track sortDirection;

	connectedCallback() {
		try {
			this.currentLoadCount = 0;
			this.loading = true;
			this.getNames().then((listOfNames) => {
				for (const prop in listOfNames) {
					this.getData(listOfNames[prop]);
				}
			});
		} catch (error) {
			this.error = error;
		}
	}

	async getNames() {
		try {
			let response1 = await getEntityNames();
			let parsedRes = JSON.parse(response1);
			this.finalLoadCount = parsedRes.length;
			return parsedRes.sort();
		} catch (error) {
			this.error = error;
		}
	}

	async getData(name) {
		try {
			let tempObj, tempObj1;
			let response1 = await getEntityData({entityName: name});
			this.currentLoadCount++;
			let parsedRes = JSON.parse(response1);


			tempObj = {
				name: name,
				fieldCount: parsedRes.length,
				unclassified: this.handleEval('SecurityClassification', parsedRes),
				cGroup: this.handleEval('ComplianceGroup', parsedRes),
				fieldData: this.handleFieldData(parsedRes,name)
			};
			tempObj1 = {
				name: name,
				fieldCount: tempObj.fieldCount,
				unclassified: tempObj.unclassified,
			};
			this.objectList.push(tempObj);
			this.csvData.push(tempObj1);

			if (this.currentLoadCount === this.finalLoadCount) {
				this.handleLoadCompleted();

			}
		} catch (error) {
			this.error = error;
		}
	}

	handleEval(fieldName, dataObj) {
		let count = 0;
		for (const prop in dataObj) {
			if (!dataObj[prop][fieldName]) {
				count++;
			} else {
				if (fieldName === 'SecurityClassification' && !this.findOptions.includes(dataObj[prop][fieldName])) {
					this.findOptions.push(dataObj[prop][fieldName]);
				}
			}
		}
		return count;
	}

	refresh() {
		this.objectList = [];
		this.findOptions = [];
		this.findData = [];
		this.template.querySelector(`[data-id="reportTable"]`).data = [];
		this.connectedCallback();
	}

	handleMdtUrl(obj){
		let returnString;
		returnString = (obj.QualifiedApiName.includes('__c') )?obj.DurableId.split('.')[1]+'%3Fsetupid%3DCustomMetadata':obj.DurableId.split('.')[0]+'%3Fsetupid%3DCustomMetadata';
		return returnString;
	}

	handleFieldData(fieldData,parentName) {
		let returnObjList = [];
		let mdtUrl = '';
		for (const prop in fieldData) {
			mdtUrl = this.handleMdtUrl(fieldData[prop]);
			returnObjList.push({
				name: fieldData[prop].QualifiedApiName,
				classification: fieldData[prop].SecurityClassification,
				complianceGroup: fieldData[prop].ComplianceGroup,
				description: fieldData[prop].Description,
				DataType: fieldData[prop].DataType,
				navUrl: (parentName.includes('__mdt'))
					?this.sfdcBaseURL+'/lightning/setup/CustomMetadata/page?address=%2F'+ mdtUrl
					:this.sfdcBaseURL+'/lightning/setup/ObjectManager/'+fieldData[prop].EntityDefinitionId+'/FieldsAndRelationships/'+fieldData[prop].DurableId.split('.')[1]+'/view'
			})
		}
		return returnObjList;
	}

	handleRowAction(event) {
		const actionName = event.detail.action.name;
		const name = event.detail.row.name;
		switch (actionName) {
			case 'view':
				this.handleSelectOfSection(name);
				break;
			default:
		}
	}

	handleLoadCompleted() {
		this.template.querySelector('[data-id=searchBox]').options = this.handleOptions();
		this.template.querySelector(`[data-id="reportTable"]`).data =  this.objectList.sort((a, b) =>
		((a.name > b.name) ? 1 : (a.name === b.name) ? ((a.name > b.name) ? 1 : -1) : -1));
		this.loading = false;
		this.showExport = true;
	}

	handleOptions() {
		let returnList = [];
		returnList.push({label: '', value: ''}, {label: 'Unclassified', value: 'unclass'});
		for (const prop in this.findOptions) {
			returnList.push({label: this.findOptions[prop], value: this.findOptions[prop]});
		}
		return returnList;
	}

	handleFind(event) {
		let filterValue = event.detail.value;
		this.showFindTable = (filterValue != '');
		this.comboBoxFilter = filterValue;
		this.handleFindTableUpdate(filterValue);
	}

	handleFindTableUpdate(filterValue) {
		if (filterValue === 'unclass') {
			filterValue = null;
		}
		let ourData = JSON.parse(JSON.stringify(this.objectList))
		let tempObj = [];
		for (const prop in ourData) {
			for (const prop1 in ourData[prop].fieldData) {
				if (ourData[prop].fieldData[prop1].classification == filterValue) {
					tempObj.push({name: ourData[prop].name});
					break;
				}
			}
		}
		this.findData = tempObj;
	}

	handleSelectOfSection(name) {
		let modal = this.template.querySelector(`[data-id="fieldModal"]`);
		modal.handleModalToggle();
		modal.setDataTable(this.handleModalData(name));
		modal.headerTitle = name + ' Fields';

		//this.activeSections = [name];
		//const element = this.template.querySelector('[data-id="' + name + '"]');
		//element.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});

	}
	handleModalData(name){

		for (const prop in this.objectList) {
			if(this.objectList[prop].name === name){
				return this.objectList[prop].fieldData;
			}
		}
	}

	handleCSVDownLoad() {
		exportCSV('Data Classification Report', this.csvData);
	}

	downloadCSVFilterFile() {
		exportCSV(this.comboBoxFilter + ' Report', this.findData);
	}

	doSortingMain(event) {
		this.sortBy = event.detail.fieldName;
		this.sortDirection = event.detail.sortDirection;
		this.sortData(this.sortBy, this.sortDirection, 'reportTable');
	}

	doSortingFind(event) {
		this.sortBy = event.detail.fieldName;
		this.sortDirection = event.detail.sortDirection;
		this.sortData(this.sortBy, this.sortDirection, 'findTable');
	}

	doSortingRecent(event) {
		this.sortBy = event.detail.fieldName;
		this.sortDirection = event.detail.sortDirection;
		this.sortData(this.sortBy, this.sortDirection, 'recentChanges');
	}

	sortData(fieldName, direction, name) {
		let parseData = JSON.parse(JSON.stringify(this.template.querySelector('[data-id="' + name + '"]').data));
		// Return the value stored in the field
		let keyValue = (a) => {
			return a[fieldName];
		};
		// checking reverse direction
		let isReverse = direction === 'asc' ? 1 : -1;
		// sorting data
		parseData.sort((x, y) => {
			x = keyValue(x) ? keyValue(x) : ''; // handling null values
			y = keyValue(y) ? keyValue(y) : '';
			// sorting values based on direction
			return isReverse * ((x > y) - (y > x));
		});
		this.template.querySelector('[data-id="' + name + '"]').data = parseData;
	}
}