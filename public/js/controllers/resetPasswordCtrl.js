
aiopApp.controller('resetPasswordCtrl', function resetPasswordCtrl($scope, $routeParams, userService, $location) {

    $scope.resetToken  = $routeParams.resetToken;
    $scope.$parent.pageTitle = "Changement de mot de passe";
    $scope.$parent.isModulePage = false;
    $scope.resetPasswordError = undefined;
    $scope.resetPasswordSuccess = undefined;

    $scope.newPassword = "";
    $scope.confirmNewPassword = "";

    $scope.doPasswordChange = function(){
        if($scope.newPassword != $scope.confirmNewPassword){
            $scope.resetPasswordError = "Le mot de passe et la confirmation du mot de passe doivent être identiques!"
        }
        else{
            $scope.$parent.isLoadingData = true;
            userService.doPasswordChange($scope.newPassword, $scope.resetToken).then(
                function(response){
                    console.log(response);
                    $scope.resetPasswordError = undefined;
                    $scope.resetPasswordSuccess = "Mot de passe changé avec succès. Vous allez être redirigé.";
                    $scope.$parent.isLoadingData = false;
                    setTimeout(function(){
                        $scope.$apply(function(){
                            $location.path("/");
                        });
                    }, 2000);
                },
                function(error){
                    console.log(error);
                    $scope.resetPasswordError = error.data;
                    $scope.$parent.isLoadingData = false;
                }
            )
        }
    }
});