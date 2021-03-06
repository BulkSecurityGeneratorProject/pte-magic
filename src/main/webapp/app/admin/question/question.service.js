(function() {
    'use strict';
    angular
        .module('pteMagicApp')
        .factory('Question', Question);

    Question.$inject = ['$resource'];

    function Question ($resource) {
        var resourceUrl =  'api/questions/:id';

        return $resource(resourceUrl, {}, {
            'query': { method: 'GET', isArray: true},
            'queryBySkill': { url: 'api/questions-by-skill', method: 'GET', isArray: true},
            'queryByType': { url: 'api/questions-by-type', method: 'GET', isArray: true},
            'queryByQuestionCountInfo': { url: 'api/questions-count-info', method: 'GET', isArray: false},
            'get': {
                method: 'GET',
                transformResponse: function (data) {
                    if (data) {
                        data = angular.fromJson(data);
                    }
                    return data;
                }
            },
            'update': { method:'PUT' }
        });
    }
})();
