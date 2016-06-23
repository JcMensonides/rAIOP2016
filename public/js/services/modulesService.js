aiopApp.factory('modulesService', function($http, userService){

    return{
        createModule: function(moduleName, moduleImgBase64Url){
            return $http({
                method: 'POST',
                url: '/api/modules',
                headers:{
                    "token": userService.token,
                    "userId": userService.userId
                },
                data: {
                    moduleName: moduleName,
                    moduleImg: moduleImgBase64Url
                }
            });
        },
        updateModule: function(moduleName, moduleImgBase64Url, moduleId){
            var urlExtention = (userService.isAdmin == true || userService.isAdmin == "true") ? '' : '/img';
            console.log(userService.isAdmin == true);
            return $http({
                method: 'PUT',
                url: '/api/modules/'+moduleId+urlExtention,
                headers:{
                    "token": userService.token,
                    "userId": userService.userId
                },
                data: {
                    moduleName: moduleName,
                    moduleImg: moduleImgBase64Url
                }
            });
        },
        getModules: function(){
            return $http({
                method: 'GET',
                url: '/api/modules'
            });
        },
        deleteModule: function(moduleId){
            return $http({
                method: 'DELETE',
                headers:{
                    "token": userService.token,
                    "userId": userService.userId
                },
                url: '/api/modules/'+moduleId
            });
        },
        modulesList: []
    }

});