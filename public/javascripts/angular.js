var app = angular.module('twoseek', ['ui.router']);

app.factory('auth', ['$http', '$window', '$rootScope', function($http, $window, $rootScope){
    var auth = {
    resetSession: function() {
            this.currentUser = null;
            this.isLoggedIn = false;
        },

    register: function(){
        var url = '/login/vk',
            width = 1000,
            height = 650,
            top = (window.outerHeight - height) / 2,
            left = (window.outerWidth - width) / 2;
        $window.open(url, 'vk_login', 'width=' + width + ',height=' + height + ',scrollbars=0,top=' + top + ',left=' + left);
    },
    
    logout: function() {
        var scope = this;
        $http.delete('/auth').success(function() {
            scope.resetSession();
            $rootScope.$broadcast('scanner-ended');
        });
    },

    success: function(userData) {
            this.currentUser = {name: userData.name, userId: userData.userId};
            this.isLoggedIn = true;
            $rootScope.$broadcast('scanner-started');
        },

    };
    auth.resetSession();
    return auth;
}]);

app.run(['$rootScope', '$window', 'auth', function ($rootScope, $window, auth) {  
    $window.app = {
        authState: function(state, user) {
            $rootScope.$apply(function() {
                switch (state) {
                    case 'success':
                        auth.success(user);
                        break;
                    case 'fail':
                        auth.reserSession();
                        break;
                }

            });
        }
    };

    if ($window.user !== null) {
        auth.success($window.user);
    }
}]);

app.factory('posts', ['$http', function($http){
    var o = { posts: []};
    o.getAll = function() {
        return $http.get('/posts').success(function(data){
            angular.copy(data, o.posts);
        });
    };
    o.create = function(post) {
        return $http.post('/posts', post).success(function(data){
            o.posts.push(data);
        });
    };
    return o;
}]);

app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('home', {
        url: '/home',
        templateUrl: '/home.html',
        controller: 'MainCtrl',
        resolve: {
            postPromise: ['posts', function(posts){
                return posts.getAll();
            }]
        }})
        .state('register', {
        url: '/register',
        templateUrl: '/register.html',
        controller: 'AuthCtrl'
        });
    $urlRouterProvider.otherwise('register');
}]);

app.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
function($scope, $state, auth){
    $scope.$on('scanner-started', function(event, args) {
        $state.go("home");
    });
    if (auth.isLoggedIn)
        $state.go("home");

    $scope.register = function(){
        auth.register();
    };
}])

app.controller('MainCtrl', [
'$scope',
'$state',
'$filter',
'auth',
'posts',
function($scope, $state, $filter, auth, posts) {
    $scope.$on('scanner-ended', function(event, args) {
        $state.go("register");
    });

    if (!auth.isLoggedIn)
        $state.go("register");

    $scope.user = auth.currentUser;
     
    $scope.logout = function(){
        auth.logout();
    };

    $scope.posts = posts.posts;

    $scope.addPost = function() {
        if (!$scope.text || $scope.text.trim() == '')
            return;
        posts.create({text: $scope.text, owner: "me", isLiked: false, datetime: $filter('date')(new Date(), 'yyyy-MM-dd HH:mm:ss')});
        $scope.text = '';
    };

    $scope.likePost = function(post) {
        post.isLiked = true;
    }
}]);
