public class LWCFieldCreatorController {

    @AuraEnabled
    public static Map<String,LWC_Field_Creator_Type_Mapping__mdt> getTypeMappings(){
        try {
            Map<String,LWC_Field_Creator_Type_Mapping__mdt> typeMetadataMap = LWC_Field_Creator_Type_Mapping__mdt.getAll();
            Map<String,LWC_Field_Creator_Type_Mapping__mdt> returnMap = new Map<String,LWC_Field_Creator_Type_Mapping__mdt>();

            for (String key : typeMetadataMap.keySet()) {
                if (typeMetadataMap.get(key).Hidden__c == false) {
                    returnMap.put(key, typeMetadataMap.get(key));
                }
            }
            return returnMap;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static Map<String,LWC_Field_Creator_Field_Mapping__mdt> getFieldMappings(){
        try {
            return LWC_Field_Creator_Field_Mapping__mdt.getAll();
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    @AuraEnabled
    public static String getObjectsViaToolingAPI(String token) {
        try {
            String query = 'select MasterLabel,DeveloperName,IsCustomSetting,QualifiedApiName,IsCustomizable from EntityDefinition where DeveloperName != null and IsCustomizable = true order by MasterLabel';
            Http ht = new Http();
            HttpRequest req = setupRequest(
                token, 
                'GET', 
                '/services/data/v56.0/tooling/query?q=' + query.replace(' ', '+'),
                'application/json'
            );
            HttpResponse res = ht.send(req);
            if (String.valueOf(res.getStatusCode()).startsWith('2')) {
                return res.getBody();
            } else {
                System.debug(res);
                throw new CalloutException(res.getBody());
            }

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static String getLayoutsViaToolingAPI(String token, String objectAPIName) {
        try {
            String query = 'select id,name from Layout where EntityDefinition.QualifiedApiName = \'' + objectAPIName +'\'';
            Http ht = new Http();
            HttpRequest req = setupRequest(
                token, 
                'GET', 
                '/services/data/v56.0/tooling/query?q=' + query.replace(' ', '+'),
                'application/json'
            );
            HttpResponse res = ht.send(req);
            if (String.valueOf(res.getStatusCode()).startsWith('2')) {
                return res.getBody();
            } else {
                System.debug(res);
                throw new CalloutException(res.getBody());
            }

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static String getGlobalValueSetsViaToolingAPI(String token) {
        try {
            String query = 'select MasterLabel from GlobalValueSet order by MasterLabel';
            Http ht = new Http();
            HttpRequest req = setupRequest(
                token, 
                'GET', 
                '/services/data/v56.0/tooling/query?q=' + query.replace(' ', '+'),
                'application/json'
            );
            HttpResponse res = ht.send(req);
            if (String.valueOf(res.getStatusCode()).startsWith('2')) {
                return res.getBody();
            } else {
                System.debug(res);
                throw new CalloutException(res.getBody());
            }

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    

    @AuraEnabled
    public static String getToken() {
        try {
            // String clientId = '';
            // String clientSecret = '';
            // String username = UserInfo.getUserName()';
            // String password = '';

            // String token = new OAuthSessionProvider(username, password, clientId, clientSecret).getToken();
            // return token;
            return UserInfo.getSessionId();
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<Profile> getProfiles() {
        try {
            return [
                SELECT Id, Name 
                FROM Profile
                WHERE UserType != 'CsnOnly' 
                AND UserType != 'Guest' 
                ORDER BY Name
            ];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<PermissionSet> getProfilesAndPermissionSets() {
        try {
            return [
                SELECT Id, Label, IsOwnedByProfile, Profile.Name
                FROM PermissionSet 
                WHERE NamespacePrefix = null 
                AND PermissionSetGroupId = null
                AND (
                    (LicenseId = null OR License.Name = 'Salesforce')
                    OR (IsOwnedByProfile = true AND Profile.UserType != 'CsnOnly' AND Profile.UserType != 'Guest')
                )
                ORDER BY Profile.Name NULLS LAST, Label
            ];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static String createField(String token, String payload){
        try {
            Http ht = new Http();
            HttpRequest req = setupRequest(
                token, 
                'POST', 
                '/services/data/v56.0/tooling/sobjects/CustomField',
                'application/json'
            );
            req.setBody(payload);
            HttpResponse res = ht.send(req);
            if (String.valueOf(res.getStatusCode()).startsWith('2')) {
                return res.getBody();
            } else {
                System.debug(res);
                throw new CalloutException(res.getBody());
            }
        } catch (Exception e) {
            System.debug(e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static void insertFLS(String sobjectName, String fieldName, String permissionsPayload){
        try {
            List<Object> permList = (List<Object>)JSON.deserializeUntyped(permissionsPayload);
            List<FieldPermissions> flsList = new List<FieldPermissions>();
            for (Object obj : permList) {
                Map<String, Object> castObj = (Map<String, Object>)obj;
                flsList.add(new FieldPermissions(
                    ParentId = (String)castObj.get('Id'),
                    SobjectType = sobjectName,
                    Field = fieldName,
                    PermissionsRead = (Boolean)castObj.get('ReadChecked'),
                    PermissionsEdit = (Boolean)castObj.get('EditChecked') 
                ));
            }
            insert flsList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<String> getLayoutMetadataViaToolingAPI(String token, List<String> selectedLayoutIds) {
        try {
            List<String> returnResults = new List<String>();
            for (String layoutId : selectedLayoutIds) {
                String query = 'select id,name,metadata from Layout where id = \'' + layoutId +'\'';
                Http ht = new Http();
                HttpRequest req = setupRequest(
                    token, 
                    'GET', 
                    '/services/data/v56.0/tooling/query?q=' + query.replace(' ', '+'),
                    'application/json'
                );
                HttpResponse res = ht.send(req);
                if (String.valueOf(res.getStatusCode()).startsWith('2')) {
                    returnResults.add(res.getBody());
                } else {
                    System.debug(res);
                    throw new CalloutException(res.getBody());
                }
            }
            return returnResults;




        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    private static HttpRequest setupRequest(String token, String method, String endpoint, String contentType) {
        String epBase = URL.getSalesforceBaseUrl().toExternalForm();
        HttpRequest req = new HttpRequest();
        Map<String, String> headers = new Map<String, String>{
            'Authorization' => 'OAuth ' + token,
            'Content-Type' => contentType
        };
        for (String header : headers.keySet()) {
            req.setHeader(header, headers.get(header));
        }
        req.setMethod(method);
        req.setEndpoint(epBase + endpoint);
        return req;
    }

    public class OAuthSessionProvider {
        private String grantType;
        private String username;
        private String password;
        private String clientId;
        private String clientSecret;
        private String endpoint;
    
        public OAuthSessionProvider(String username, String password, String clientId, String clientSecret) {
            this.grantType = 'password';
            this.username = username;
            this.password = password;
            this.clientId = clientId;
            this.clientSecret = clientSecret;
            this.endpoint =  [SELECT IsSandbox FROM Organization LIMIT 1].IsSandbox 
                ? 'https://test.salesforce.com/services/oauth2/token' 
                : 'https://login.salesforce.com/services/oauth2/token';
        }
    
        public OAuthSessionProvider(String username, String password, String clientId, String clientSecret, String endpoint) {
            this.grantType = 'password';
            this.username = EncodingUtil.urlEncode(username, 'UTF-8');
            this.password = EncodingUtil.urlEncode(password, 'UTF-8');
            this.clientId = EncodingUtil.urlEncode(clientId, 'UTF-8');
            this.clientSecret = EncodingUtil.urlEncode(clientSecret, 'UTF-8');
            this.endpoint =  endpoint;
        }
        
        public String getToken() {
            Http http = new Http();
            HttpRequest request = new HttpRequest();
            request.setEndpoint(endpoint);
            request.setMethod('POST');
            request.setHeader('Content-Type', 'application/x-www-form-urlencoded');
            request.setBody(
                'grant_type=' + this.grantType +
                '&client_id=' + this.clientId + 
                '&client_secret=' + this.clientSecret + 
                '&username=' + this.username + 
                '&password=' + this.password
            );
            HttpResponse response = http.send(request);
            Map<String, Object> results = (Map<String, Object>)JSON.deserializeUntyped(response.getBody());
            if (response.getStatusCode() == 200){
                String token = (String)results.get('access_token');
                return token;
            } else {
                throw new CalloutException('FAILED TO GET TOKEN');
            }
        }
    }
}