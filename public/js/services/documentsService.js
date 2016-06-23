aiopApp.factory('documentsService', function($http, userService){

    return{
        createDocument: function(documentName, fileType, documentBase64, moduleId, documentIsPrivate){
            return $http({
                method: 'POST',
                headers:{
                    "token": userService.token,
                    "userId": userService.userId
                },
                url: '/api/modules/'+moduleId+'/documents',
                data: {
                    documentName: documentName,
                    documentType: documentIsPrivate ? "private" : "public",
                    fileType: fileType,
                    file: documentBase64
                }
            });
        },
        getDocuments: function(moduleId){
            var urlExtention= (userService.token == undefined) ? '/public' : ''
            return $http({
                method: 'GET',
                headers:{
                    "token": userService.token,
                    "userId": userService.userId
                },
                url: '/api/modules/'+moduleId+'/documents'+urlExtention
            });
        },
        getDocument: function(documentId){
            var urlExtention= (userService.token == undefined) ? '/public' : ''
            return $http({
                method: 'GET',
                headers:{
                    "token": userService.token,
                    "userId": userService.userId
                },
                url: '/api/documents/'+documentId+urlExtention
            });
        },
        deleteDocument: function(documentId){
            return $http({
                method: 'DELETE',
                headers:{
                    "token": userService.token,
                    "userId": userService.userId
                },
                url: '/api/documents/'+documentId
            })
        },
        updateDocument: function(documentId, documentIsPrivate, documentName, fileType, documentBase64){
            return $http({
                method: 'PUT',
                headers:{
                    "token": userService.token,
                    "userId": userService.userId
                },
                url:'/api/documents/'+documentId,
                data:{
                    documentId: documentId,
                    documentType: documentIsPrivate ? "private" : "public",
                    documentName: documentName,
                    fileType: fileType,
                    file: documentBase64
                }
            })
        }
    }

});