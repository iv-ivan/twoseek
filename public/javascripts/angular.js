var app = angular.module('twoseek', ['ui.router']);

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
        }
    });
    $urlRouterProvider.otherwise('home');
}]);

app.controller('MainCtrl', [
'$scope',
'$filter',
'posts',
function($scope, $filter, posts) {
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
