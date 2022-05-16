import { LightningElement,track,api } from 'lwc';
import {exportCSV} from 'c/exportUtil';
const columns = [
    {label: 'Name', fieldName: 'navUrl', type: 'url',sortable: "true",
    typeAttributes: {
        target:'_blank',
        label: {
            fieldName: 'name'
        }
    }
},	{label: 'Classification', fieldName: 'classification', sortable: 'true'},
	{label: 'Data Compliance Group', fieldName: 'complianceGroup', sortable: 'true'},

];
export default class FieldsModal extends LightningElement {
    columns = columns;
    @track data;
    @api toggleModal = false;
    @api apiData;
    @api headerTitle;
    @api handleModalToggle(){
        this.toggleModal = !this.toggleModal;
    }
    @api setDataTable(dataObj){
        this.data = dataObj;
    }
    handleCSVDownLoad() {
		exportCSV(this.headerTitle + 'Audit', this.data);
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