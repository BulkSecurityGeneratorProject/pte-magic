(function() {
    'use strict';

    angular
        .module('pteMagicApp')
        .controller('MockTestController', MockTestController);

    MockTestController.$inject = ['$scope', '$window', 'Principal', 'LoginService', '$state', '$rootScope', '$timeout', 'ExamType'];

    function MockTestController ($scope, $window, Principal, LoginService, $state, $rootScope, $timeout, ExamType) {
    	var vm = this;
        vm.showExamList = showExamList;
        vm.startTest = startTest;
        vm.examShowFlag = false;
        vm.partAExams = [];
        vm.partBExams = [];
        vm.fullExams = [];
        vm.writingExams = [];
        vm.selectedType;
        vm.selectedExams = [];

        vm.totalExamQuestionReading = 0;
        vm.totalExamQuestionListening = 0;
        vm.totalExamQuestionSpeaking = 0;
        vm.totalExamQuestionWriting = 0;

        function showExamList(type) {
        	
            if(type == 'MOCK_TEST_A'){
                $timeout(function (){
                  angular.element('#pastA').addClass("active");
                  angular.element('#pastAMobile').addClass("activeMobile");
                });

                vm.selectedExams = vm.partAExams;
            }else if(type == 'MOCK_TEST_B'){
            	$timeout(function (){
                    angular.element('#pastA').addClass("active");
                    angular.element('#pastAMobile').addClass("activeMobile");
                  });

                vm.selectedExams = vm.partBExams;
            }if(type == 'MOCK_TEST_FULL'){
            	$timeout(function (){
                    angular.element('#pastA').addClass("active");
                    angular.element('#pastAMobile').addClass("activeMobile");
                  });
                vm.selectedExams = vm.writingExams;
            }
            vm.examShowFlag = true;
            vm.selectedType = type;
        }

        function startTest(examId) {
        	var url = '/#/test?type=' + examId;
        	$window.open(url,"_blank", "toolbar=no,scrollbars=no, resizable=no, width=1200, height=700");
        }

        // Init controller
  		(function initController() {
  	        vm.totalExamQuestionReading = 0;
  	        vm.totalExamQuestionListening = 0;
  	        vm.totalExamQuestionSpeaking = 0;
  	        vm.totalExamQuestionWriting = 0;

  	        ExamType.getAllByType({type: 'MOCK_TEST_A'},
  					function(data, headers) {
  	        			if (data != null) {
  	        				vm.partAExams = data;

  			  				angular.forEach(data, function(value, key){
  		  	            		vm.totalExamQuestionListening += value.totalQuestion;
  			  	            });
  	        			}
  					},
  					function(error) {
  					});

  			ExamType.getAllByType({type: 'MOCK_TEST_B'},
  					function(data, headers) {
  						if (data != null) {
			  				vm.partBExams = data;
	
			  				angular.forEach(data, function(value, key){
		  	            		vm.totalExamQuestionReading += value.totalQuestion;
			  	            });
  						}
  					},
  					function(error) {
  					});

  			ExamType.getAllByType({type: 'MOCK_TEST_FULL'},
  					function(data, headers) {
  						if (data != null) {
			  				vm.fullExams = data;
	
			  				angular.forEach(data, function(value, key){
		  	            		vm.totalExamQuestionSpeaking += value.totalQuestion;
			  	            });
  						}
  					},
  					function(error) {
  					});

  		})();
    }
})();

