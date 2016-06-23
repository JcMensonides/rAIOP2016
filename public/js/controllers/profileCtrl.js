
aiopApp.controller('profileCtrl', function profileCtrl($scope, $routeParams, userService, $location, $cookies) {

    $scope.$parent.pageTitle= "Mon profile";
    $scope.$parent.isModulePage = false;
    $scope.userService = userService;

    $scope.newFirstname = userService.firstname;
    $scope.newLastname = userService.lastname;
    $scope.newEmail = userService.userEmail;

    if(userService.token == undefined){
        $location.path("/");
    }

    $scope.updateProfile = function(){
        if($scope.newFirstname == "" || $scope.newLastname == "" || $scope.newEmail == ""){
            $scope.profileUpdateError = "Un champ ne peut être vide";
            $scope.newFirstname = userService.firstname;
            $scope.newLastname = userService.lastname;
            $scope.newEmail = userService.userEmail;
        }
        else{
            $scope.$parent.isLoadingData = true;
            userService.updateProfile($scope.newFirstname, $scope.newLastname, $scope.newEmail).then(
                function(response){
                    userService.firstname = $scope.newFirstname;
                    userService.lastname = $scope.newLastname;
                    userService.userEmail = $scope.newEmail;

                    $cookies.put("userEmail", $scope.newEmail);
                    $cookies.put("fistname", $scope.newFirstname);
                    $cookies.put("lastname", $scope.newLastname);
                    $scope.$parent.isLoadingData = false;
                },
                function(error){
                    console.log(error);
                    $scope.profileUpdateError = error.data;
                    $scope.$parent.isLoadingData = false;
                }
            )
        }
    }
    
});