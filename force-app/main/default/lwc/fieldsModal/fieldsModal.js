import { LightningElement,track,api } from 'lwc';
import {exportCSV} from 'c/exportUtil';

export default class FieldsModal extends LightningElement {
    @api displayComplianceInfo = false;
    @track data;
    @track columns;
    @api toggleModal = false;
    @api apiData;
    @api headerTitle;
    @api handleModalToggle(){
        this.toggleModal = !this.toggleModal;
    }
    @api setDataTable(dataObj){
        this.data = dataObj;
        this.columns = this.getColumns();
    }
    handleCSVDownLoad() {
		exportCSV(this.headerTitle + 'Audit', this.data);
	}
    toggleFields(){
        this.displayComplianceInfo = !this.displayComplianceInfo;
        this.columns = this.getColumns();
    }
    getColumns(){
        if(this.displayComplianceInfo){
            return [
                {label: 'Name', fieldName: 'navUrl', type: 'url',sortable: "true",typeAttributes: {target:'_blank',label: {fieldName: 'name'}}},
                {label: 'Data Type', fieldName: 'DataType', sortable: 'true'},
                {label: 'Description', fieldName: 'description', typeAttributes: {title:'description'}, sortable: 'true'},
                ]

        }
        else{
            return [
                {label: 'Name', fieldName: 'navUrl', type: 'url',sortable: "true",typeAttributes: {target:'_blank',label: {fieldName: 'name'}}},
                {label: 'Classification', fieldName: 'classification', sortable: 'true'},
                {label: 'Data Compliance Group', fieldName: 'complianceGroup', sortable: 'true'},
                ]
        }
    }
    /**** Data Table Sorting boiler plate ****/
    sortBy;
    sortDirection;
    doSorting(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection);
    }
    sortData(fieldname, direction) {
        let parseData = JSON.parse(JSON.stringify(this.data));
        // Return the value stored in the field
        let keyValue = (a) => {
            return a[fieldname];
        };
        // cheking reverse direction
        let isReverse = direction === 'asc' ? 1: -1;
        // sorting data
        parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : ''; // handling null values
            y = keyValue(y) ? keyValue(y) : '';
            // sorting values based on direction
            return isReverse * ((x > y) - (y > x));
        });
        this.data = parseData;
    }
/**** End Of Data Table Sorting boiler plate ****/

}