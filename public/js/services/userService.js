aiopApp.factory('userService', function($http, $location){
    //url: 'https://'+$location.host()+':'+$location.port()+'/api/login',
    return{
        userId: undefined,
        token: undefined,
        isAdmin: false,
        doLogin: function(email, password){
            return $http({
                method: 'POST',
                url: '/api/login',
                data: {
                    email: email,
                    password: password
                }
            });
        },
        doLogout: function(){
            return $http({
                method: 'POST',
                url: '/api/logout',
                data: {
                    userId: this.userId,
                    token: this.token
                }
            });
        },
        requestResetPassword: function(email){
            return $http({
                method: 'POST',
                url: '/api/resetPassword',
                data: {
                    email: email,
                }
            });
        },
        doPasswordChange: function(newPassword, resetToken){
            return $http({
                method: 'POST',
                url: '/api/resetPassword/'+resetToken,
                data: {
                    password: newPassword,
                }
            });
        },
        updateProfile: function(newFirstname, newLastname, newEmail){
            return $http({
                method: 'PUT',
                url: '/api/users/self',
                headers:{
                    "token": this.token,
                    "userId": this.userId
                },
                data: {
                    firstname: newFirstname,
                    lastname: newLastname,
                    email: newEmail
                }
            });
        },
        createUser: function(email, password, firstname, lastname){
            return $http({
                method: 'POST',
                url: '/api/users',
                headers:{
                    "token": this.token,
                    "userId": this.userId
                },
                data: {
                    firstname: firstname,
                    lastname: lastname,
                    email: email,
                    password: password
                }
            });
        },
        deleteUser: function(userId){
            return $http({
                method: 'DELETE',
                url: '/api/users/'+userId,
                headers:{
                    "token": this.token,
                    "userId": this.userId
                }
            });
        },
        updateUserAsAdmin: function(newEmail, newFirstname, newLastname, userId){
            return $http({
                method: 'PUT',
                url: '/api/users/'+userId+'/asAdmin',
                headers:{
                    "token": this.token,
                    "userId": this.userId
                },
                data: {
                    firstname: newFirstname,
                    lastname: newLastname,
                    email: newEmail
                }
            });
        },
    }

});

