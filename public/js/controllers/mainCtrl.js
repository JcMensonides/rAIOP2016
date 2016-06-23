
aiopApp.controller('mainCtrl', function mainCtrl($scope, $uibModal, $cookies, userService, $location) {

    $scope.userEmail = "";
    $scope.userPassword = "";
    $scope.loginError = undefined;
    $scope.userService = userService;
    $scope.isLoadingData = false;
    $scope.sortDocumentsBy = "documentName";

    if($cookies.get("token") != undefined){
        userService.userEmail = $cookies.get("userEmail");
        userService.firstname = $cookies.get("fistname");
        userService.lastname = $cookies.get("lastname");
        userService.userId = $cookies.get("userId");
        userService.token = $cookies.get("token");
        userService.isAdmin = $cookies.get("isAdmin");
    }

    $scope.openLoginModal = function () {
        $scope.userEmail = "";
        $scope.userPassword = "";
        $scope.loginError = undefined;
        $scope.loginModal = $uibModal.open({
            animation: true,
            templateUrl: 'templates/loginModal.html',
            scope: $scope
        });
    };

    $scope.doLogin = function(){
        var userEmail = $scope.userEmail;
        $scope.isLoadingData = true;
        userService.doLogin($scope.userEmail, $scope.userPassword).then(
            function(response){
                console.log(response);

                userService.userEmail = userEmail;
                $cookies.put("userEmail", userEmail);
                userService.firstname = response.data.firstname;
                $cookies.put("fistname", response.data.firstname);
                userService.lastname = response.data.lastname;
                $cookies.put("lastname", response.data.lastname);
                userService.userId = response.data.userId;
                $cookies.put("userId", response.data.userId);
                userService.token = response.data.token;
                $cookies.put("token", response.data.token);
                userService.isAdmin = response.data.isAdmin;
                $cookies.put("isAdmin", response.data.isAdmin);

                $scope.loginModal.close();
                $scope.isLoadingData = false;
                $location.path("/")
            },
            function(error){
                console.log(error);
                $scope.loginError = error.data;
                $scope.isLoadingData = false;
            }
        );
    }

    $scope.doLogout = function(){
        $scope.isLoadingData = true;
        userService.doLogout().then(
            function(response){
                console.log(response);
                userService.userEmail = undefined;
                userService.firstname = undefined;
                userService.lastname = undefined;
                userService.userId = undefined;
                userService.token = undefined;
                userService.isAdmin = false;

                $cookies.remove("userEmail");
                $cookies.remove("firstname");
                $cookies.remove("lastname");
                $cookies.remove("userId");
                $cookies.remove("token");
                $cookies.remove("isAdmin");
                $scope.isLoadingData = false;
                $location.path("/")
            },
            function(error){
                console.log(error);
                userService.userEmail = undefined;
                userService.firstname = undefined;
                userService.lastname = undefined;
                userService.userId = undefined;
                userService.token = undefined;
                userService.isAdmin = false;

                $cookies.remove("userEmail");
                $cookies.remove("firstname");
                $cookies.remove("lastname");
                $cookies.remove("userId");
                $cookies.remove("token");
                $cookies.remove("isAdmin");
                $scope.isLoadingData = false;
                $location.path("/")
            }
        );
    }

    $scope.openRequestResetPasswordModal = function (userEmail) {
        if(userEmail != undefined){
            $scope.userEmail = userEmail;
        }
        $scope.requestResetPasswordSuccess = undefined;
        $scope.requestResetPasswordError = undefined
        $scope.requestResetPasswordModal = $uibModal.open({
            animation: true,
            templateUrl: 'templates/RequestResetPasswordModal.html',
            scope: $scope
        });
    };

    $scope.requestResetPassword = function(email){
        var emailOfTheUser = (email == undefined) ? $scope.userEmail : email;
        $scope.isLoadingData = true;
        userService.requestResetPassword(emailOfTheUser).then(
            function(response){
                console.log(response);
                $scope.requestResetPasswordSuccess = response.data;
                $scope.isLoadingData = false;
            },
            function(error){
                console.log(error);
                $scope.requestResetPasswordError = error.data;
                $scope.isLoadingData = false;
            }
        );
    }

    $scope.goToModulePage = function (){
        $location.path("/")
    }

    $scope.goToProfilePage = function (){
        $location.path("/profile")
    }

    $scope.goToAdminPage = function (){
        $location.path("/admin")
    }
});