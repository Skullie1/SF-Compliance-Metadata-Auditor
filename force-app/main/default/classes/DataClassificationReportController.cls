@SuppressWarnings('PMD.ApexCRUDViolation') // All queries in this class are performed using the Tooling API
public inherited sharing class DataClassificationReportController {
	@AuraEnabled
	public static String getEntityData(String entityName) {
		DataClassificationReportController controller = new DataClassificationReportController();
		List<FieldDefinition> cacheQueryResultFields = [
				SELECT DeveloperName, QualifiedApiName, ComplianceGroup, SecurityClassification, EntityDefinition.QualifiedApiName, DurableId, Description, DataType, BusinessStatus
				FROM FieldDefinition
				WHERE EntityDefinition.QualifiedApiName = :entityName
		];

		return JSON.serialize(controller.removeOmittedFields(cacheQueryResultFields));
	}

	@AuraEnabled
	public static String getEntityDataSingle(String entityName, String fieldName) {
		List<FieldDefinition> cacheQueryResultFields = [
				SELECT DeveloperName, QualifiedApiName, ComplianceGroup, SecurityClassification, EntityDefinition.QualifiedApiName
				FROM FieldDefinition
				WHERE EntityDefinition.QualifiedApiName = :entityName AND QualifiedApiName = :fieldName
		];

		return JSON.serialize(cacheQueryResultFields);
	}

	@AuraEnabled
	public static String getEntities() {
		Data_Classification__mdt metaSOQLData = [
				SELECT reportable_entity_json__c
				FROM Data_Classification__mdt
				WHERE MasterLabel = 'default'
		];

		List<String> apexList = (List<String>) JSON.deserialize(metaSOQLData?.reportable_entity_json__c, List<String>.class);

		return JSON.serialize(apexList);
	}
    @AuraEnabled
    public static string getEntitiesForInput(){
        // 
        Map<String, Schema.SObjectType> gd = Schema.getGlobalDescribe();
        list<Schema.SObjectType> targetList = new list<Schema.SObjectType>();
        //
        list<String> returnList = new list<String>();
        //
        for(Schema.SObjectType d : gd.values())
        {
            Schema.DescribeSObjectResult ds = d.getDescribe();
            //sorting out entities
            if(checkForType(ds) ){
                returnList.add(ds.getName());
            }
        }
        return JSON.serialize(returnList);
    }
    public static Boolean checkForType(Schema.DescribeSObjectResult ds){
        Boolean returnValue=false;
        if(ds.isCustom() ||
            ds.getName().contains('__mdt') ||
            !ds.getName().contains('__')){
                returnValue = true;
        }
        return returnValue;
    }

	/**
	 * @description Retrieves a JSON-serialized list of all reportable objects defined in the default
	 * Data_Classification__mdt record.
	 *
	 * @return A JSON-serialized list of object API names OR null value.
	 */
	@AuraEnabled
	public static String getMetaDataForValues() {
		Data_Classification__mdt metaSOQLData = [SELECT reportable_entity_json__c FROM Data_Classification__mdt WHERE MasterLabel = 'default'];

		return JSON.serialize(metaSOQLData?.reportable_entity_json__c);
	}

	@AuraEnabled
	public static String saveMetaValues(List<String> fieldNameList, List<String> fieldValueList) {
		String fullMetadataName = 'Data_Classification.default';
		String label = 'default';
		Map<String, String> myMap = new Map<String, String>();
		for(Integer listIndex = 0; listIndex < fieldNameList.size(); listIndex ++){
			myMap.put(fieldNameList[listIndex],fieldValueList[listIndex]);
		}
		MetadataDML.createUpdateMetadata(fullMetadataName, label, myMap);

		return JSON.serialize(null);
	}

	/**
	 * @description Retrieves a JSON-serialized list of all omitted fields defined in the default
	 * Data_Classification__mdt record.
	 *
	 * @return A JSON-serialized list of field API names OR null value.
	 */
	@AuraEnabled
	public static String getMetaDataForOmittedValues() {
		Data_Classification__mdt metaSOQLData = [
				SELECT Omitted_Fields__c
				FROM Data_Classification__mdt
				WHERE MasterLabel = 'default'
		];

		return JSON.serialize(metaSOQLData?.Omitted_Fields__c);
	}

	@AuraEnabled
	public static String handleRecentFieldsApex(String targetDate) {
		Datetime currentDate = Datetime.newInstance(Long.valueOf(targetDate));
		String queryStr = 'SELECT DeveloperName,TableEnumOrId,LastModifiedDate,CreatedDate FROM CustomField where LastModifiedDate >= ' +
				currentDate.formatGmt('yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
		String toolingQ = EncodingUtil.urlEncode(queryStr, 'UTF-8');

		HttpRequest req = new HttpRequest();
		req.setEndpoint('callout:DataClass_NC/services/data/v45.0/tooling/query/?q=' + toolingQ);
		req.setMethod('GET');
		HttpResponse resp = new Http().send(req);

		Map<String, Object> myMap = (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());

		return JSON.serialize(myMap);
	}

	/**
	 * @description Enriches a JSON-serialized list of object entity IDs with matching qualified API names.
	 *
	 * @param serializedEntIdList A JSON-serialized list of object entity IDs.
	 *
	 * @return A JSON-serialized list of object entity definitions with their IDs & qualified API names.
	 */
	@AuraEnabled
	public static String handleNameTranslation(String serializedEntIdList) {
		List<String> entIdList = (List<String>) JSON.deserialize(serializedEntIdList, List<String>.class);
		List<EntityDefinition> soqlList = [
				SELECT DurableId, QualifiedApiName
				FROM EntityDefinition
				WHERE DurableId IN :entIdList
		];

		return JSON.serialize(soqlList);
	}

	public List<FieldDefinition> removeOmittedFields(List<FieldDefinition> valueList) {
		Data_Classification__mdt metaSOQLData = [
				SELECT Omitted_Fields__c
				FROM Data_Classification__mdt
				WHERE MasterLabel = 'default'
		];

		List<String> apexList = (List<String>) JSON.deserialize(metaSOQLData?.Omitted_Fields__c, List<String>.class);

		for (Integer i = (valueList.size() - 1); i >= 0; i--) {
			if (apexList.contains(valueList[i].DeveloperName)) {
				valueList.remove(i);
			}
		}

		return valueList;
	}
}