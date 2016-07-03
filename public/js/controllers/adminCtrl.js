
aiopApp.controller('adminCtrl', function adminCtrl($scope, $routeParams, userService, $location, $cookies, $http, $uibModal) {

    $scope.$parent.pageTitle= "Administration";
    $scope.$parent.isModulePage = false;
    $scope.userService = userService;

    $scope.getUsers = function(callback){
        $scope.$parent.isLoadingData = true;
        $http({
            method: 'GET',
            url: '/api/users',
            headers:{
                "token": userService.token,
                "userId": userService.userId
            }
        }).then(
            function(response){
                $scope.$parent.isLoadingData = false;
                console.log(response);
                $scope.userList = response.data;
                if(typeof callback == "function"){
                    callback();
                }
            },
            function(error){
                console.log(error);
                $scope.userList = undefined;
                $scope.$parent.isLoadingData = false;
            }
        )
    }

    $scope.getUsers();

    $scope.openCreateUserModal = function () {
        $scope.newUserEmail = "";
        $scope.newUserPassword = "";
        $scope.newUserConfirmPassword = "";
        $scope.newUserFirstname = "";
        $scope.newUserLastname = "";
        $scope.createUserError = undefined;
        $scope.createUserModal = $uibModal.open({
            animation: true,
            templateUrl: 'templates/createUserModal.html',
            scope: $scope
        });
    };

    $scope.createUser = function(){
        if($scope.newUserPassword != $scope.newUserConfirmPassword){
            $scope.createUserError = "Le mot de passe et sa confirmation doivent être identiques"
        }
        else{
            $scope.$parent.isLoadingData = true;
            userService.createUser($scope.newUserEmail, $scope.newUserPassword, $scope.newUserFirstname, $scope.newUserLastname).then(
                function(response){
                    console.log(response);
                    $scope.getUsers(function(){
                        $scope.createUserModal.close();
                    });
                },
                function(error){
                    console.log(error);
                    $scope.createUserError = error.data;
                    $scope.$parent.isLoadingData = false;
                }
            );
        }
    }

    $scope.deleteUser = function(user){
        $scope.$parent.isLoadingData = true;
        userService.deleteUser(user.id).then(
            function(response){
                console.log(response);
                $scope.getUsers();
            },
            function(error){
                console.log(error);
                $scope.createUserError = error.data;
                $scope.$parent.isLoadingData = false;
            }
        );
    }
    
    $scope.openUpdateUserModal = function (user) {
        $scope.newUserEmail = user.email;
        $scope.newUserFirstname = user.firstname;
        $scope.newUserLastname = user.lastname;
        $scope.userId = user.id;
        $scope.updateUserError = undefined;
        $scope.updateUserModal = $uibModal.open({
            animation: true,
            templateUrl: 'templates/updateUserModal.html',
            scope: $scope
        });
    };

    $scope.updateUser = function(){
        $scope.$parent.isLoadingData = true;
        userService.updateUserAsAdmin($scope.newUserEmail, $scope.newUserFirstname, $scope.newUserLastname, $scope.userId).then(
            function(response){
                console.log(response);
                $scope.getUsers(function(){
                    $scope.updateUserModal.close();
                });
            },
            function(error){
                console.log(error);
                $scope.updateUserError = error.data;
                $scope.$parent.isLoadingData = false;
            }
        );
    }

    $scope.getOperations = function(){
        $scope.$parent.isLoadingData = true;
        $http({
            method: 'GET',
            url: '/api/operations',
            headers:{
                "token": userService.token,
                "userId": userService.userId
            }
        }).then(
            function(response){
                console.log(response);
                $scope.operations = response.data;
                $scope.$parent.isLoadingData = false;
                
            },
            function(error){
                console.log(error);
                $scope.$parent.isLoadingData = false;
            }
        );
    }

    $scope.getOperations();

});