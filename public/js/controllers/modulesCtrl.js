
aiopApp.controller('modulesCtrl', function modulesCtrl($scope, $uibModal, Upload, modulesService, $location, userService) {

    $scope.modulesService = modulesService;
    $scope.modulesBy4 = [];
    $scope.$parent.pageTitle= "Modules";
    $scope.$parent.isModulePage = true;
    $scope.userService = userService;

    initModulesList();

    function initModulesList(callback){
            $scope.$parent.isLoadingData = true;
            modulesService.modulesList = undefined;
            modulesService.getModules().then(
            function(response){
                console.log(userService.isAdmin);
                modulesService.modulesList = response.data; //response.data;
                var newArray = response.data.slice();
                $scope.modulesBy4 = [];
                while(newArray.length){
                    $scope.modulesBy4.push(newArray.splice(0, 4));
                }
                if(typeof callback == "function"){
                    callback();
                }else{
                    $scope.$parent.isLoadingData = false;
                }
            },
            function(error){
                console.log(error);
                $scope.$parent.isLoadingData = false;
            }
        );
    }

    $scope.newModuleName = "";
    $scope.newModuleImg = undefined;
    $scope.openCreateModuleModal = function () {
        $scope.newModuleName = "";
        $scope.newModuleImg = undefined;
        $scope.createModuleError = undefined;
        $scope.createModuleModal = $uibModal.open({
            animation: true,
            templateUrl: 'templates/createModuleModal.html',
            scope: $scope
        });
    };

    $scope.createModule = function() {
        if (($scope.createModuleForm.newModuleImg.$valid && $scope.newModuleImg) || $scope.newModuleImg == undefined) {
            $scope.$parent.isLoadingData = true;
            Upload.base64DataUrl($scope.newModuleImg).then(function(base64Url){
                modulesService.createModule($scope.newModuleName, base64Url).then(
                    function(response){
                        console.log(response);
                        initModulesList(function(){
                            $scope.createModuleModal.close();
                            $scope.$parent.isLoadingData = false;
                        })
                    },
                    function(error){
                        $scope.createModuleError = error.data;
                        $scope.$parent.isLoadingData = false;
                    }
                );
            });
        }
    };

    $scope.openUpdateModuleModal = function (module) {
        $scope.newModuleName = module.moduleName;
        $scope.updateModuleId = module.id;
        $scope.newModuleImg = undefined;
        $scope.updateModuleError = undefined;
        $scope.updateModuleModal = $uibModal.open({
            animation: true,
            templateUrl: 'templates/updateModuleModal.html',
            scope: $scope
        });
    };

    $scope.updateModule = function() {
        if (($scope.updateModuleForm.newModuleImg.$valid && $scope.newModuleImg) || $scope.newModuleImg == undefined) {
            $scope.$parent.isLoadingData = true;
            Upload.base64DataUrl($scope.newModuleImg).then(function(base64Url){
                modulesService.updateModule($scope.newModuleName, base64Url, $scope.updateModuleId).then(
                    function(response){
                        console.log(response);
                        initModulesList(function(){
                            $scope.updateModuleModal.close();
                            $scope.$parent.isLoadingData = false;
                        })
                    },
                    function(error){
                        $scope.updateModuleError = error.data;
                        $scope.$parent.isLoadingData = false;
                    }
                );
            });
        }
    };

    $scope.openConfirmDeleteModule = function(module){
        $scope.moduleBeingDeleted = module;
        $scope.confirmDeleteModule = $uibModal.open({
            animation: true,
            templateUrl: 'templates/confirmDeleteModule.html',
            scope: $scope
        });
    }
    $scope.deleteModule = function(module) {
        $scope.$parent.isLoadingData = true;
        modulesService.deleteModule(module.id).then(
            function(response){
                initModulesList();
                $scope.confirmDeleteModule.close();
            },
            function(error){
                alert(error);
                $scope.confirmDeleteModule.close();
                $scope.$parent.isLoadingData = false;
            }
        )
    };

    $scope.goToModule = function (module){
        modulesService.activeModule = module;
        $location.path("/module/"+module.id+"/documents")
    }
    
});