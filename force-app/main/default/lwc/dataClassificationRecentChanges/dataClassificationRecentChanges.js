import {LightningElement, track} from 'lwc';
import getMatchingNames from '@salesforce/apex/DataClassificationReportController.handleNameTranslation';
import getRecentFields from '@salesforce/apex/DataClassificationReportController.handleRecentFieldsApex';
import getEntityDataSingle from '@salesforce/apex/DataClassificationReportController.getEntityDataSingle';
import {exportCSV} from 'c/exportUtil';

export default class DataClassificationRecentChanges extends LightningElement {
	count;
	finishCount;
	fullList = {};
	loading = false;
	recentColumns = [
		{label: 'Entity Name', fieldName: 'entityName', sortable: "true", initialWidth: 250},
		{label: 'Field Name', fieldName: 'fieldName', sortable: "true", initialWidth: 200},
		{label: 'Data Classification', fieldName: 'classification', sortable: "true", initialWidth: 200},
		{label: 'Compliance Group', fieldName: 'complianceGroup', sortable: "true", initialWidth: 200},
		{label: 'Created Date', fieldName: 'createdDate', sortable: "true", initialWidth: 125},
		{label: 'Modified Date', fieldName: 'modifiedDate', sortable: "true", initialWidth: 125}
	];
	recentFieldInfo;
	suppressPackagedInfo = true;
	suppressedList = {};
	targetDate;

	@track sortBy;
	@track sortDirection;

	connectedCallback() {
		const tDate = new Date();
		this.targetDate = tDate.setMonth(tDate.getMonth() - 1 );
		this.loading = true;
		this.handleRecentFields(this.targetDate);
	}

	async handleRecentFields(tDate) {
		let res = await getRecentFields({targetDate: tDate});
		let pRes = JSON.parse(res);
		this.recentFieldInfo = pRes;
		let translateSet = [];

		for (const prop in pRes.records) {
			if (!pRes.records[prop].TableEnumOrId.search(/[a-zA-Z\d]{18}|[a-zA-Z\d]{15}/)) {
				if (translateSet.indexOf(pRes.records[prop].TableEnumOrId) === -1) {
					translateSet.push(pRes.records[prop].TableEnumOrId);
				}
			}
		}
		this.handleNameTranslation(translateSet);
	}

	async handleNameTranslation(listToTranslate) {
		let res = await getMatchingNames({serializedEntIdList: JSON.stringify(listToTranslate)});
		let recentTableData = [];
		let listWithNames = JSON.parse(res);
		let tempName;
		for (const prop in this.recentFieldInfo.records) {
			if (!this.recentFieldInfo.records[prop].TableEnumOrId.search(/[a-zA-Z\d]{18}|[a-zA-Z\d]{15}/)) {
				tempName = this.handleEntityName(listWithNames, this.recentFieldInfo.records[prop].TableEnumOrId);
				recentTableData.push({
					entityName: tempName,
					fieldName: this.recentFieldInfo.records[prop].DeveloperName,
					classification: '',
					complianceGroup: '',
					createdDate: this.recentFieldInfo.records[prop].CreatedDate.split('T')[0].replace('T', ''),
					modifiedDate: this.recentFieldInfo.records[prop].LastModifiedDate.split('T')[0].replace('T', '')
				})
			} else {
				recentTableData.push({
					entityName: this.recentFieldInfo.records[prop].TableEnumOrId,
					fieldName: this.recentFieldInfo.records[prop].DeveloperName,
					classification: '',
					complianceGroup: '',
					createdDate: this.recentFieldInfo.records[prop].CreatedDate.split('T')[0].replace('T', ''),
					modifiedDate: this.recentFieldInfo.records[prop].LastModifiedDate.split('T')[0].replace('T', '')
				})
			}
		}
		recentTableData = this.handleOtherInfo(recentTableData);
	}

	async handleOtherInfo(TableData) {
		this.count = 0;
		this.finishCount = TableData.length;
		let fieldInfoRes = '';
		let pRes = {};
		//TODO: Avoid awaiting in the loop to allow parallel data gathering.
		for (const prop in TableData) {
			this.count++;
			fieldInfoRes = await getEntityDataSingle({
				entityName: TableData[prop].entityName,
				fieldName: TableData[prop].fieldName + '__c'
			});

			pRes = JSON.parse(fieldInfoRes);
			TableData[prop].classification = (pRes[0]) ? pRes[0].SecurityClassification : 'no data retrieved';
			TableData[prop].complianceGroup = (pRes[0]) ? pRes[0].ComplianceGroup : 'no data retrieved';

		}
		if (this.count === this.finishCount) {
			this.fullList = TableData;
			this.suppressedList = this.removeRows(TableData);
			this.template.querySelector(`[data-id="recentChanges"]`).data = (this.suppressPackagedInfo) ? this.fullList : this.suppressedList;
			this.loading = false;
		}

		return TableData;
	}

	updateTable() {
		let x = this.template.querySelector(`[data-id="targetDateInput"]`);
		if (x.checkValidity()) {
			this.loading = true;
			this.template.querySelector(`[data-id="recentChanges"]`).data = [];
			this.handleRecentFields(this.targetDate.getTime());
		}
	}

	setTargetDate() {
		let elementValue = this.template.querySelector(`[data-id="targetDateInput"]`);
		if (elementValue.checkValidity()) {
			let parts = elementValue.value.split('-');
			this.targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
		}
	}

	removeRows(tableData) {
		let returnList = [];
		for (const prop in tableData) {
			if (tableData[prop].complianceGroup !== 'no data retrieved') {
				returnList.push(tableData[prop]);
			}
		}
		return returnList;
	}

	handleEntityName(nameList, idToMatch) {
		for (const prop in nameList) {
			if (idToMatch.includes(nameList[prop].DurableId)) {
				return nameList[prop].QualifiedApiName;
			}
		}
		return '**Unidentified**';
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

	handleCSVDownLoad() {
		exportCSV('Recent Fields Audit Report', this.template.querySelector(`[data-id="recentChanges"]`).data);
	}

	handleToggleChange(){
		this.template.querySelector(`[data-id="recentChanges"]`).data = (this.template.querySelector(`[data-id="packageToggle"]`).checked)? this.suppressedList:this.fullList;
	}
}