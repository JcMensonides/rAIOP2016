
aiopApp.controller('documentsCtrl', function documentsCtrl($scope, $uibModal, Upload, documentsService, $routeParams, userService) {

    $scope.moduleId = $routeParams.moduleId;
    $scope.documentsService = documentsService;
    $scope.$parent.pageTitle= "Documents";
    $scope.$parent.isModulePage = false;

    $scope.newDocument = undefined;
    $scope.openCreateDocumentModal = function () {
        $scope.newDocument = undefined;
        $scope.newDocumentIsPrivate = false;
        $scope.createDocumentError = undefined;
        $scope.createDocumentModal = $uibModal.open({
            animation: true,
            templateUrl: 'templates/createDocumentModal.html',
            scope: $scope
        });
    };

    $scope.createDocument = function(){
        if (($scope.createDocumentForm.newDocument.$valid && $scope.newDocument)) {
            $scope.$parent.isLoadingData = true;
            Upload.base64DataUrl($scope.newDocument).then(function(base64Url){
                documentsService.createDocument($scope.newDocument.name, $scope.newDocument.type, base64Url, $scope.moduleId, $scope.newDocumentIsPrivate).then(
                    function(response){
                        console.log(response);
                        $scope.getDocuments(function(){
                            $scope.newDocument = undefined;
                            $scope.createDocumentModal.close();
                            $scope.$parent.isLoadingData = false;
                        });
                    },
                    function(error){
                        $scope.createDocumentError = error.data;
                        $scope.$parent.isLoadingData = false;
                    }
                );
            });
        }
    }

    $scope.openUpdateDocumentModal = function (documentToUpdate) {
        $scope.newDocumentIsPrivate = documentToUpdate.documentType == "private" ? true : false;
        $scope.updateDocumentError = undefined;
        $scope.newDocument = undefined;
        $scope.updateDocumentId = documentToUpdate.id;
        $scope.updateDocumentModal = $uibModal.open({
            animation: true,
            templateUrl: 'templates/updateDocumentModal.html',
            scope: $scope
        });
    };

    $scope.updateDocument = function(){
        if (($scope.updateDocumentForm.newDocument.$valid && $scope.newDocument) || $scope.newDocument == undefined) {
            $scope.$parent.isLoadingData = true;
            if($scope.newDocument == undefined){
                documentsService.updateDocument($scope.updateDocumentId, $scope.newDocumentIsPrivate, undefined, undefined, undefined).then(
                    function(response){
                        console.log(response);
                        $scope.getDocuments(function(){
                            $scope.updateDocumentModal.close();
                            $scope.$parent.isLoadingData = false;
                        });
                    },
                    function(error){
                        $scope.updateDocumentError = error.data;
                        $scope.$parent.isLoadingData = false;
                    }
                );
            }
            else{
                Upload.base64DataUrl($scope.newDocument).then(function(base64Url){
                    documentsService.updateDocument($scope.updateDocumentId, $scope.newDocumentIsPrivate, $scope.newDocument.name, $scope.newDocument.type, base64Url).then(
                        function(response){
                            console.log(response);
                            $scope.getDocuments(function(){
                                $scope.updateDocumentModal.close();
                                $scope.$parent.isLoadingData = false;
                            });
                        },
                        function(error){
                            $scope.updateDocumentError = error.data;
                            $scope.$parent.isLoadingData = false;
                        }
                    );
                });
            }
        }
    }

    $scope.getDocuments = function(callback){
        $scope.$parent.isLoadingData = true;
        documentsService.documentsList = undefined;
        documentsService.getDocuments($scope.moduleId).then(
            function(response){
                console.log(response);
                documentsService.documentsList = response.data;
                if(typeof callback == "function"){
                    callback();
                }
                else{
                    $scope.$parent.isLoadingData = false;
                }
            },
            function(error){
                console.log(error);
                documentsService.documentsList = undefined;
                $scope.$parent.isLoadingData = false;
            }
        )
    }

    $scope.getDocuments();

    

    $scope.downloadDocument = function(documentToSearch){
        $scope.$parent.isLoadingData = true;
        documentsService.getDocument(documentToSearch.id).then(
            function(response){
                console.log(response.data);
                var retrievedDocument = response.data;
                var a = document.createElement('a');
                a.style = "display: none";  
                var blob = Upload.dataUrltoBlob(retrievedDocument.file, retrievedDocument.documentName);
                var blobUrl = window.URL.createObjectURL(blob);
                
                a.href = blobUrl;
                a.download = retrievedDocument.documentName;
                document.body.appendChild(a);
                a.click();
                setTimeout(function(){
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(blobUrl);
                }, 100);
                $scope.$parent.isLoadingData = false;
            },
            function(error){
                console.log(error);
                $scope.$parent.isLoadingData = false;
            }

        )
         
    }

    $scope.deleteDocument = function(documentToDelete){
        $scope.$parent.isLoadingData = true;
        documentsService.deleteDocument(documentToDelete.id).then(
            function(response){
                var indexOfdocumentToDelete =  documentsService.documentsList.indexOf(documentToDelete);
                documentsService.documentsList.splice(indexOfdocumentToDelete, 1);
                $scope.$parent.isLoadingData = false;
            },
            function(error){
                console.log(error);
                $scope.$parent.isLoadingData = false;
            }

        )
    }

});