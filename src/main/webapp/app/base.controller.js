// code style: https://github.com/johnpapa/angular-styleguide
// Create by: Nam, Nguyen Hoai - ITSOL.vn

(function() {
    '';
    angular
      .module('pteMagicApp')
      .controller('PteMagicBaseController', PteMagicBaseController)
        .directive( 'elemReady', ['$parse', function( $parse ) {
            return {
                restrict: 'A',
                link: function( $scope, elem, attrs ) {
                    elem.ready(function(){
                        $scope.$apply(function(){
                            var func = $parse(attrs.elemReady);
                            func($scope);
                        })
                    })
                }
            }
        }]);

    PteMagicBaseController.$inject = ['vm', '$rootScope', '$scope', '$window', '$compile', '$timeout', 'PTE_SETTINGS'
    	, 'Answer', 'ngAudio', '$interval', 'Upload', '$ngConfirm'];

    function PteMagicBaseController(vm, $rootScope, $scope, $window, $compile, $timeout, PTE_SETTINGS
    		, Answer, ngAudio, $interval, Upload, $ngConfirm){
		vm.message = { name: 'default entry from PteMagicBaseController' };

		var encoderWorker = new Worker('content/audio_recorder/mp3Worker.js');
		
		// Attribute
		vm.currentQuestion = 0;
		vm.totalQuestion = 0;
		vm.currentSKill = '';
		vm.countAudio = 3;

		vm.listeningTimerRunningFlag = false;
        vm.readingTimerRunningFlag = false;
        vm.speakingTimerRunningFlag = false;
        vm.writingTimerRunningFlag = false;

        vm.txtStatusAudio = 'Playing';
		// inteval
		vm.intervalAudio;
		vm.intervalCounter;
		vm.intervalToRecording;
		vm.intervalProgress;
		
		vm.countdown = 60; // 2min10second
		vm.showProgressBar = false;
		vm.countdownPercent = 0;
		vm.questionGroup;
		vm.counter;
		vm.showRecording = true;
		vm.answers = [];
		vm.selectedQuestion;
        $scope.models = {
	        selected: null,
	        lists: {"Source": [], "Target": []},
            fillInTheBlankQuestionArr: [],
            answer: [],
            fillInTheBlanklLists: {"questionPanel": []},
            startText: '',
            fillInTheBlankPartialTexts: []
	    };
        vm.fileUpload;
        vm.readingFIBRCount = 0;

        vm.checkClickspell = true;
        vm.CharacterLength = 0;
        vm.WORDS_MAXIMUM = 1000; // changeable
        vm.WordsLength=0;
        vm.Text = "";
        vm.audio;
        vm.isShowAnswer = false;
        vm.timeup = timeup;
        vm.formatExpectAnswer = formatExpectAnswer;
        
        vm.uploadRecordingLink;
        vm.examType;
        vm.setCountdownTimer = setCountdownTimer;
        
        var extensionLists = {}; //Create an object for all extension lists
    	extensionLists.audio = ['mp3', 'mpeg','wav','mp4', 'webm'];  
    	extensionLists.image = ['jpg', 'gif', 'bmp', 'png', 'jpeg'];

    	vm.btnEnable = true;
    	vm.btnDisabled = true;
    	
    	vm.calCountdownAudio = calCountdownAudio;
    	
    	// One validation function for all file types    
    	function isValidFileType(fName, fType) {
    	    return extensionLists[fType].indexOf(fName.split('.').pop()) > -1;
    	}
    	
		// Function
    	vm.uploadRecording = uploadRecording;
		vm.initBase = initBase;
		vm.getUserAnswer = getUserAnswer;
		vm.closeExam = closeExam;
		vm.updateQuestionInfo = updateQuestionInfo;
		vm.countdownToRecording = countdownToRecording;
    	vm.startRecording = startRecording;
        vm.dropCallback = dropCallback;
        vm.movedCallback = movedCallback;
        vm.resetProgressStatus = resetProgressStatus;
        vm.initCountQuestion = initCountQuestion;
        vm.prepareFillInTheBlanks = prepareFillInTheBlanks;
        vm.callBackAudioEnded = callBackAudioEnded;
        vm.saveAnswer = saveAnswer;
        vm.saveAnswerSpeaking = saveAnswerSpeaking;
        vm.IsAlphabet = IsAlphabet;
        vm.spellCheck = spellCheck;
        vm.UpdateLengths = UpdateLengths;
        vm.playAudio = playAudio;
        vm.enableNextButton = enableNextButton;
        vm.nextPage = nextPage;
        vm.resetUserAnswer = resetUserAnswer;
        
        vm.audioProgressing = 0;
        $scope.$watch('vm.audioProgressing', function () {
        	if (vm.audioProgressing == 100) {
        		if (vm.questionGroup == 'SPEAKING') {
        			console.log('callBackAudioEnded, recording ...');
        			vm.callBackAudioEnded();
        		}
                console.log('audio done');
        	}
        });
        
        $scope.$watch('vm.fileUpload', function (file) {
            var file;
            if (file) {
                file.upload = Upload.upload({
                    url: '/api/file/upload/answer',
                    data: {file: vm.fileUpload},
                    ignoreLoadingBar: true
                });

                file.upload.then(function (response) {
                    $timeout(function () {
                        file.result = response.data;
                        vm.uploadRecordingLink = file.result.filename;
                        toastr.success('File upload success');
                    });
                }, function (response) {
                    if (response.status > 0) {
                    	$scope.errorMsg = response.status + ': ' + response.data;
                    	toastr.error('File upload error');
                    }
                }, function (evt) {
                    file.progress = Math.min(100, parseInt(100.0 *
                        evt.loaded / evt.total));
                });
            }
        });
        
        function formatExpectAnswer(selQuestion) {
        	let html = '';
        	if (selQuestion == null || selQuestion == undefined) {
        		return '';
        	}
        	
        	// LISTENING_MCQ_L_SINGLE_ANSWER, LISTENING_MCQ_L_MULTIPLE_ANSWER
        	if (selQuestion.type == 'LISTENING_MCQ_L_SINGLE_ANSWER' || selQuestion.type == 'LISTENING_MCQ_L_MULTIPLE_ANSWER'
        		|| selQuestion.type == 'LISTENING_HIGHLIGHT_CORRECT_SUMMARY' || selQuestion.type == 'LISTENING_SELECT_MISSING_WORD'
    			|| selQuestion.type == 'READING_FIB_R' || selQuestion.type == 'READING_RE_ORDER_PARAGRAPH'
				|| selQuestion.type == 'READING_MCQ_R_SINGLE_ANSWER' || selQuestion.type == 'READING_MCQ_R_MULTIPLE_ANSWER'
				) {
        		let answers = selQuestion.expectAnswer.split(', ');
        		angular.forEach(answers, function (item) {
        			let tmp = selQuestion["answer" + item];
        			html = html + '<div>' + item + ' - ' + tmp + '</div>';
        		});
        	} else {
        		// LISTENING_SUMMARIZE_SPOKEN_TEXT, LISTENING_FIB_L, 
        		html = selQuestion.expectAnswer;
        	}
        	
        	return html;
        }
        
        function timeup() {
//        	$scope.$broadcast('timer-stop');
//        	$ngConfirm({
//                title: 'Time\'s up',
//                icon: 'fas fa-exclamation-triangle',
//                theme: 'modern',
//                type: 'red',
//                content: '<div class="text-center">Time\'s up! Check answer or next question.</div>',
//                animation: 'scale',
//                closeAnimation: 'scale',
//                buttons: {
//                    ok: {
//                    	text: 'Đóng',
//                        btnClass: "btn-blue"
//                    }
//                },
//            });
        }
        
        function nextPage() {
        	$('#next-page-answer').click();
        }
        
        // Disable button and anable
    	function enableNextButton() {
    		vm.btnDisabled = true;
    		if (vm.intervalDisableBtn) {
        		$interval.cancel(vm.intervalDisableBtn);
        	}
        	vm.countDisabled = 3;
        	vm.intervalDisableBtn = $interval(function() {
            	vm.countDisabled--;
                // Display 'counter' wherever you want to display it.
                if (vm.countDisabled == 0) {
                	vm.btnDisabled = false;
                	$interval.cancel(vm.intervalDisableBtn);
                }
            }, 1000);
    	}
        
        $scope.$watch('vm.audio.progress', function () {
        	if (vm.audio == undefined) {
        		return;
        	}

        	if (vm.audio.progress == 1) {
        		vm.audioProgressing = 100;
        		return;
        	}

        	if (vm.audio.progress > 0) {
        		vm.audioProgressing = vm.audio.progress * 100;
        	}
        });

        function resetProgressStatus() {
        	vm.resetUserAnswer();
        	
    		vm.showProgressBar = false;
    		vm.countdownPercent = 0;
    		vm.timeProgress = 0;

    		if (vm.audio) {
//    			vm.audio.destroy();
    			vm.audio.progress = 0;
    			vm.audio.pause();
    		}
    		
    		// question bank
    		if ($("#player-audio-my-record").length > 0) {
    			$("#player-audio-my-record")[0].pause();
        		$("#player-audio-my-record")[0].src = "";
    		}
    		if ($("#player-audio-media").length > 0) {
    			$("#player-audio-media")[0].pause();
        		$("#player-audio-media")[0].src = "";
    		}
    	}

        function playAudio(link, timeout) {
        	if (link == null || link == '') {
            	return;
            }
        	
        	// valid audio -> play
        	if (!isValidFileType(link, 'audio')) {
        		console.log('No aupport audio type, ' + link);
                return;
            }

        	console.log('play audio:' + link);
            vm.checkAudioSeconds = false;
            vm.checkStatusPlay = true;

            vm.audio = ngAudio.load(link);
            vm.audio.volume = 0.5;
            $timeout(function(){
//        		if (vm.audio.canPlay && vm.audio.error == false) {
        			vm.audio.play();
//        		} else {
//        			alert("Can not play audio");
//        		}
            }, timeout );
    	}

        function spellCheck() {
            if(vm.checkClickspell == true){
                document.getElementById("areaTextWriting").setAttribute("spellcheck", "true");
                vm.checkClickspell = false;
            }else {
                document.getElementById("areaTextWriting").setAttribute("spellcheck", "false");
                vm.checkClickspell = true;
            }
        }

        function UpdateLengths($event) {
            vm.CharacterLength = vm.Text.length;
            vm.WordsLength=0;

            if(vm.Text.length == 1 && vm.Text[0]!='')
            {
                vm.WordsLength = 1;
            }

            for( var i=1; i< vm.Text.length; i++)
            {
                if( vm.IsAlphabet(vm.Text[i])  && !vm.IsAlphabet(vm.Text[i-1]))
                {
                    vm.WordsLength++;
                    if(vm.WordsLength == vm.WORDS_MAXIMUM + 1)// WORDS_MAXIMUM = 10
                    {
                        vm.WordsLength--;
                        vm.Text = vm.Text.substring(0, i);
                        return;
                    }
                }else if (vm.IsAlphabet(vm.Text[i]) && vm.IsAlphabet(vm.Text[i-1]) )
                {
                    if(vm.WordsLength==0)
                    {
                        vm.WordsLength=1;
                    }
                }else if(!vm.IsAlphabet(vm.Text[i]) && !vm.IsAlphabet(vm.Text[i-1]))
                {
                    continue;
                }else if(!vm.IsAlphabet(vm.Text[i]) && vm.IsAlphabet(vm.Text[i-1]))
                {
                    continue;
                }
            }

            if (vm.selectedQuestion.type == 'WRITING_SUMMARIZE_WRITTEN_TEXT' && vm.WordsLength > 75) {
                alert("The maximum words are only 75!");
            }
            if (vm.selectedQuestion.type == 'WRITING_ESSAY' && vm.WordsLength > 300) {
                alert("The maximum words are only 300!");
            }
        }
        function IsAlphabet(character)
        {
            var numeric_char = character.charCodeAt(character);

            if(numeric_char>64 && numeric_char<91)// A-Z
            {
                return true;
            }
            if(numeric_char>96 && numeric_char<123)// a-z
            {
                return true;
            }
            return false;
        }

        function saveAnswerSpeaking(selectedQuestionId, audioLink) {
        	console.log('saveAnswerSpeaking, selectedQuestionId:' + selectedQuestionId + ", audioLink:" + audioLink);
            var answer = {};
            
            if (vm.examType == 'QUESTION_BANK') {
            	answer.examId = -1;
            } else {
            	answer.status = 'MARKING';
            	answer.examId = vm.exam.examDTO.id;
            }
            answer.questionId = selectedQuestionId;
            answer.audioLink = audioLink;

            Answer.save(answer, onSaveAnswerSuccess, onSaveAnswerError);

            function onSaveAnswerSuccess(result) {
            	// namnh fix 02/1/2019
            	// vm.uploadRecordingLink = result.audioLink;
            	console.log('saveAnswerSpeaking sucess');
            }

            function onSaveAnswerError(result) {
            	console.log('saveAnswerSpeaking error,' + result);
            }
        }

        function saveAnswer() {
        	// Skip if time break
            if (vm.selectedQuestion.type == 'TIME_BREAK') {
                return;
            }

  			// Save result
  			var answer = {};
  		    answer.examId = vm.exam.examDTO.id;
  		    answer.questionId = vm.selectedQuestion.id;

  		    if (answer.examId == null || answer.examId == '' || answer.questionId == null || answer.questionId == '') {
  		    	alert("examID or questionID is null or invalid");
  		    	console.log("examID or questionID is null or invalid, examID: " + answer.examId + ", questionID: " + answer.questionId);
  		    	return;
  		    }

  		    answer.answer = vm.answers.join(',');
  		
  		    // Auto score
  		    if (vm.questionGroup == 'READING' 
  		    	|| vm.selectedQuestion.type == 'LISTENING_FIB_L'
	    		|| vm.selectedQuestion.type == 'LISTENING_MCQ_L_SINGLE_ANSWER'
    			|| vm.selectedQuestion.type == 'LISTENING_MCQ_L_MULTIPLE_ANSWER'
				|| vm.selectedQuestion.type == 'LISTENING_HIGHLIGHT_CORRECT_SUMMARY'
				|| vm.selectedQuestion.type == 'LISTENING_SELECT_MISSING_WORD'
				|| vm.selectedQuestion.type == 'LISTENING_HIGHLIGHT_INCORRECT_WORD') {
  		    	answer.status = '';
		    } else {
		    	answer.status = 'MARKING';
		    }
  		    // answer.audioLink;
  		    // answer.description;

  			Answer.save(answer, onSaveAnswerSuccess, onSaveAnswerError);

  			function onSaveAnswerSuccess() {
  	  		}

  	  		function onSaveAnswerError() {
  	  			console.log('Error saveAnswer');
  	  		}
  		}

        function callBackAudioEnded() {
            console.log('play audio ended!');
            vm.showRecording = true;
            vm.txtStatusAudio = 'Completed';
            if(vm.selectedQuestion.type == 'SPEAKING_REPEAT_SENTENCE'){
                vm.counter = 2;
            }else if(vm.selectedQuestion.type == 'SPEAKING_ANSWER_SHORT_QUESTION'){
                vm.counter = 1;
            }else if(vm.selectedQuestion.type == 'SPEAKING_RETELL_LECTURE'){
                vm.counter = 10;
            }else if(vm.selectedQuestion.type == 'SPEAKING_READ_ALOUD'){
                vm.counter = 40;
            }else{
                vm.counter = 30;
            }

            // Beep sound
            if(vm.selectedQuestion.type != 'SPEAKING_REPEAT_SENTENCE' && vm.selectedQuestion.type != 'SPEAKING_ANSWER_SHORT_QUESTION' && vm.selectedQuestion.type != 'SPEAKING_RETELL_LECTURE') {
                setTimeout(function (){
                    $("#player1")[0].play();
                }, 1000);
            }

            if(vm.intervalCounter) {
        		$interval.cancel(vm.intervalCounter);
            }
        	vm.intervalCounter = $interval(function() {
        		console.log('vm.counter recording:' + vm.counter);
                vm.counter--;

                // Display 'counter' wherever you want to display it.
                if (vm.counter == 0) {
                    // Beep sound
                    if(vm.selectedQuestion.type == 'SPEAKING_RETELL_LECTURE') {
                        $("#player1")[0].play();
                    }

                    // Display a login box
                    $interval.cancel(vm.intervalCounter);
                    vm.startRecording();
                }
            }, 1000);
        }

        function prepareFillInTheBlanks() {
            if (vm.selectedQuestion.type == 'READING_FIB_R' && vm.readingFIBRCount == 0) {
                var dragInput = $("#dragInput")[0];
                var selQuestion = vm.selectedQuestion;
                var count = (selQuestion.text.match(/@Blank@/g) || []).length;
                var partialTexts = selQuestion.text.split('@Blank@');
                if(partialTexts.length > count) {
                    var startTextSpan = document.createElement('span');
                    startTextSpan.className = "dragArea";
                    startTextSpan.innerHTML = partialTexts[0];
                    dragInput.insertBefore(startTextSpan, dragInput.children[0]);

                    for (var i = 1; i <= count; i++) {
                        var textSpan = document.createElement('span');
                        textSpan.className = "dragArea";
                        textSpan.innerHTML = partialTexts[i];
                        dragInput.insertBefore(textSpan, dragInput.children[i*2]);
                    }
                } else if(partialTexts.length == count) {
                    if(selQuestion.text.indexOf('@Blank@') > 0) {
                        var startTextSpan = document.createElement('span');
                        startTextSpan.className = "dragArea";
                        startTextSpan.innerHTML = partialTexts[0];
                        dragInput.insertBefore(startTextSpan, dragInput.children[0]);

                        for (var i = 1; i <= count; i++) {
                            var textSpan = document.createElement('span');
                            textSpan.className = "dragArea";
                            textSpan.innerHTML = partialTexts[i];
                            insertAfter(textSpan, dragInput.children[i*2]);
                        }
                    } else {
                        for (var i = 0; i < count; i++) {
                            var textSpan = document.createElement('span');
                            textSpan.className = "dragArea";
                            textSpan.innerHTML = partialTexts[i];
                            insertAfter(textSpan, dragInput.children[i*2]);
                        }
                    }
                } else {
                    for (var i = 0; i < count; i++) {
                        var textSpan = document.createElement('span');
                        textSpan.className = "dragArea";
                        textSpan.innerHTML = partialTexts[i];
                        insertAfter(textSpan, dragInput.children[i*2]);
                    }
                }
                vm.readingFIBRCount++;
            }
        }

    	function initCountQuestion() {
    		// Speaking -> Writing -> Reading -> Listening
    		// A: Speaking/Writing
    		// B: Reading/Listening
    		// init
    		if (vm.currentSKill == '') {
    			if (vm.exam.examTypeDTO.type == 'MOCK_TEST_A') {
    				vm.currentSKill = 'SPEAKING'; // writing
    				vm.currentQuestion = 0;
    				vm.totalQuestion = vm.exam.numberQuestionSpeaking;
    			} else if (vm.exam.examTypeDTO.type == 'MOCK_TEST_B') {
    				vm.currentSKill = 'READING'; // listening
    				vm.currentQuestion = 0;
    				vm.totalQuestion = vm.exam.numberQuestionReading;
    			} else {
    				vm.currentSKill = 'SPEAKING';
    				vm.currentQuestion = 0;
    				vm.totalQuestion = vm.exam.numberQuestionSpeaking;
    			}

//    			vm.countdown = 40 * 60;
//				$scope.$broadcast('timer-stop');
//				$scope.$broadcast('timer-start');
    		} else if (vm.currentSKill == 'SPEAKING') {
    			// Part A + Full
    			if (vm.exam.examTypeDTO.type == 'MOCK_TEST_A') {
    				vm.currentSKill = 'WRITING'; // writing
    				vm.currentQuestion = 0;
    				vm.totalQuestion = vm.exam.numberQuestionWriting;
    			} else {
    				vm.currentSKill = 'WRITING';
    				vm.currentQuestion = 0;
    				vm.totalQuestion = vm.exam.numberQuestionWriting;
    			}
    		} else if (vm.currentSKill == 'WRITING') {
    			// Part A + Full
    			if (vm.exam.examTypeDTO.type == 'MOCK_TEST_A') {
    				vm.currentSKill = 'END'; // writing
    				vm.currentQuestion = 0;
    				vm.totalQuestion = vm.exam.numberQuestionWriting;
    			} else {
    				vm.currentSKill = 'READING';
    				vm.currentQuestion = 0;
    				vm.totalQuestion = vm.exam.numberQuestionReading;
    			}
    		} else if (vm.currentSKill == 'READING') {
    			// Part B + Full
//    			vm.countdown = 40 * 60;
//				$scope.$broadcast('timer-stop');
//				$scope.$broadcast('timer-start');

    			if (vm.exam.examTypeDTO.type == 'MOCK_TEST_B') {
    				vm.currentSKill = 'LISTENING'; // writing
    				vm.currentQuestion = 0;
    				vm.totalQuestion = vm.exam.numberQuestionListening;
    			} else {
    				vm.currentSKill = 'LISTENING';
    				vm.currentQuestion = 0;
    				vm.totalQuestion = vm.exam.numberQuestionListening;
    			}
//    		} else if (vm.currentSKill == 'LISTENING') {
    			// Part B + Full

    		}
    	}

    	function calProgress() {
    		vm.timeProgress = 0;
    		if(vm.intervalProgress) {
        		$interval.cancel(vm.intervalProgress);
            }
    		vm.intervalProgress = $interval(function() {
    			vm.timeProgress++;
    			if( vm.selectedQuestion.type == 'SPEAKING_READ_ALOUD'){
                    vm.countdownPercent = vm.timeProgress / PTE_SETTINGS.RECORDING_TIME_SPEAKING_READ_ALOUD * 100; // 40s
                    if (vm.timeProgress == PTE_SETTINGS.RECORDING_TIME_SPEAKING_READ_ALOUD) {
                        console.log('timeProgress:' + vm.timeProgress);
                        // Display a login box
                        $interval.cancel(vm.intervalProgress);

                        // answer
                        $timeout(function(){
                        	vm.answer();
                        }, 1000 );
                    }
                }else if(vm.selectedQuestion.type == 'SPEAKING_REPEAT_SENTENCE' || vm.selectedQuestion.type == 'SPEAKING_ANSWER_SHORT_QUESTION'){
                    vm.countdownPercent = vm.timeProgress / PTE_SETTINGS.RECORDING_TIME_SPEAKING_REPEAT_SENTENCE_OR_ANSWER_SHORT_QUESTION * 100; // 10
                    if (vm.timeProgress == PTE_SETTINGS.RECORDING_TIME_SPEAKING_REPEAT_SENTENCE_OR_ANSWER_SHORT_QUESTION) {
                        console.log('timeProgress:' + vm.timeProgress);
                        // Display a login box
                        $interval.cancel(vm.intervalProgress);
                        // answer
                        $timeout(function(){
                        	vm.answer();
                        }, 1000 );
                    }
                }else{
                    vm.countdownPercent = vm.timeProgress / PTE_SETTINGS.RECORDING_TIME_SPEAKING_OTHER * 100;
                    if (vm.timeProgress == PTE_SETTINGS.RECORDING_TIME_SPEAKING_OTHER) {
                        console.log('timeProgress:' + vm.timeProgress);
                        // Display a login box
                        $interval.cancel(vm.intervalProgress);
                        // answer
                        $timeout(function(){
                        	vm.answer();
                        }, 1000 );
                    }
                }
    		    // Display 'counter' wherever you want to display it.

    		}, 1000);
    	}

		function startRecording() {
			console.log('startRecording');
			// Reset
			resetProgressStatus();

    		// start recording
	        if (!audioRecorder)
	            return;
	        audioRecorder.clear();
	        audioRecorder.record();
	        vm.txtInfoCountdown = "Recording ...";
	        if (document.getElementById('pteBlockRecord') != null && document.getElementById('pteBlockRecord') != undefined) {
	        	document.getElementById('pteBlockRecord').className = "pte-block-record";
	        }
            
        	vm.isRecording = true;

	        if (vm.selectedQuestion.type == 'SPEAKING_REPEAT_SENTENCE'
                || vm.selectedQuestion.type == 'SPEAKING_DESCRIBE_IMAGE'
                || vm.selectedQuestion.type == 'SPEAKING_RETELL_LECTURE'
                || vm.selectedQuestion.type == 'SPEAKING_ANSWER_SHORT_QUESTION'
                || vm.selectedQuestion.type == 'SPEAKING_READ_ALOUD'
            ) {
	        	vm.showProgressBar = true;
	        	calProgress();
	        }
    	}

		function calCountdownAudio() {
			switch(vm.selectedQuestion.type) {
			    case "LISTENING_SUMMARIZE_SPOKEN_TEXT":
			    	vm.countAudio = 10;
			        break;
			    case "LISTENING_FIB_L":
			    case "LISTENING_MCQ_L_MULTIPLE_ANSWER":
			    case "LISTENING_MCQ_L_SINGLE_ANSWER":
			    	vm.countAudio = 7;
			        break;
			    case "LISTENING_HIGHLIGHT_CORRECT_SUMMARY":
			    	vm.countAudio = 10;
			        break;
			    case "LISTENING_SELECT_MISSING_WORD":
			    case "LISTENING_HIGHLIGHT_INCORRECT_WORD":
			    case "LISTENING_DICTATION":
			    	vm.countAudio = 5;
			        break;
			    default:
			    	vm.countAudio = 3;
			}
		}
		
		function countdownToRecording() {
			console.log('countdownToRecording!, type:' + vm.selectedQuestion.type);
			
    		if (vm.questionGroup == 'SPEAKING') {
    			if (vm.selectedQuestion.type == 'SPEAKING_REPEAT_SENTENCE' || vm.selectedQuestion.type == 'SPEAKING_RETELL_LECTURE' || vm.selectedQuestion.type == 'SPEAKING_ANSWER_SHORT_QUESTION') {
    				return;
    			}
    			
        		vm.showRecording = true;
                if(vm.selectedQuestion.type == 'SPEAKING_DESCRIBE_IMAGE'){
                    vm.counter = PTE_SETTINGS.COUNT_DOWN_TIME_SPEAKING_DESCRIBE_IMAGE; // 25
                }else if(vm.selectedQuestion.type == 'SPEAKING_READ_ALOUD'){
                    vm.counter = PTE_SETTINGS.COUNT_DOWN_TIME_SPEAKING_READ_ALOUD; // 40
                }else{
                    vm.counter = PTE_SETTINGS.COUNT_DOWN_TIME_SPEAKING_OTHER; // 30
                }

                if(vm.intervalToRecording) {
            		$interval.cancel(vm.intervalToRecording);
                }
        		vm.intervalToRecording = $interval(function() { //setInterval(function() {
        			if (vm.counter > 0) {
        				vm.counter--;
        			} else if (vm.counter == 0) {
                        // Beep sound
                        $("#player1")[0].play();

                        startRecording();
                        
        		        // Display a login box
                        $interval.cancel(vm.intervalToRecording);
        		    }
        		}, 1000);
    		}
    	}

		function buildSelectElement(answer) {
  			var arrAnswer = answer.split('/');
			var optTmp = '';
			angular.forEach(arrAnswer, function (data) {
					optTmp = optTmp + "<option>" + data + "</option>";
			});
			var sel = '<select name="select" class="select_READING_FIB_R_W"><option value=""></option>' + optTmp + '</select>';
			return sel;
  		}

	    // add any other shared functionality here.
		function initBase() {
			console.log('init base');
		}

		function closeExam() {
  			$window.close();
  		}

		function updateQuestionInfo(selQuestion) {
            // Replace @Blank@
            if (selQuestion.type == 'READING_FIB_R') {
            	$scope.models = {
            	        selected: null,
            	        lists: {"Source": [], "Target": []},
                        fillInTheBlankQuestionArr: [],
                        answer: [],
                        fillInTheBlanklLists: {"questionPanel": []},
                        startText: '',
                        fillInTheBlankPartialTexts: []
            	    };

            	$scope.models.answer = {};
                $scope.models.selected = null;
                // selQuestion.description = selQuestion.description.replace(/@Blank@/g, '<input type="text" name="input" class="input_answer pte-writing-input"/>');
                //selQuestion.description.split('@Blank@').join('xxxxxxx');
                $scope.models.fillInTheBlanklLists.questionPanel = [];

                var count = (selQuestion.text.match(/@Blank@/g) || []).length;

                for (var i = 0; i < count; i++) {
                    var name = "answer" + i;
                    // $scope.models.answer[i] = {"answer": []};
                    $scope.models.answer[name] = {};
                    $scope.models.answer[name][i] = [];
                    $scope.models.fillInTheBlankQuestionArr.push($scope.models.answer[name]);
                }

                $scope.models.fillInTheBlanklLists.questionPanel.push({label: selQuestion.answerA, key: "A"});
                $scope.models.fillInTheBlanklLists.questionPanel.push({label: selQuestion.answerB, key: "B"});
                $scope.models.fillInTheBlanklLists.questionPanel.push({label: selQuestion.answerC, key: "C"});
                $scope.models.fillInTheBlanklLists.questionPanel.push({label: selQuestion.answerD, key: "D"});
                $scope.models.fillInTheBlanklLists.questionPanel.push({label: selQuestion.answerE, key: "E"});
                // more answer
                if (selQuestion.answerF != "" && selQuestion.answerF != null) {
  					$scope.models.fillInTheBlanklLists.questionPanel.push({label: selQuestion.answerF, key: "F"});
  				}
                if (selQuestion.answerG != "" && selQuestion.answerG != null) {
  					$scope.models.fillInTheBlanklLists.questionPanel.push({label: selQuestion.answerG, key: "G"});
  				}
                if (selQuestion.answerH != "" && selQuestion.answerH != null) {
  					$scope.models.fillInTheBlanklLists.questionPanel.push({label: selQuestion.answerH, key: "H"});
  				}
                if (selQuestion.answerI != "" && selQuestion.answerI != null) {
  					$scope.models.fillInTheBlanklLists.questionPanel.push({label: selQuestion.answerI, key: "I"});
  				}
                if (selQuestion.answerJ != "" && selQuestion.answerJ != null) {
  					$scope.models.fillInTheBlanklLists.questionPanel.push({label: selQuestion.answerJ, key: "J"});
  				}

                vm.readingFIBRCount = 0;
                var dragInput = $("#dragInput")[0];
                $(".dragArea").remove();
            }

            if (selQuestion.type == 'LISTENING_FIB_L') {
                selQuestion.description = selQuestion.description.replace(/@Blank@/g, '<input type="text" name="input" class="input_answer pte-writing-input"/>');
                //selQuestion.description.split('@Blank@').join('xxxxxxx');
            }

  			if (selQuestion.type == 'READING_FIB_R_W') {
  				if (selQuestion.answerA != "" && selQuestion.answerA != null) {
  					var txt = buildSelectElement(selQuestion.answerA);
  					selQuestion.text = selQuestion.text.replace(/@Blank@/, txt);
  				}
  				if (selQuestion.answerB != "" && selQuestion.answerB != null) {
  					var txt = buildSelectElement(selQuestion.answerB);
  					selQuestion.text = selQuestion.text.replace(/@Blank@/, txt);
  				}
  				if (selQuestion.answerC != "" && selQuestion.answerC != null) {
  					var txt = buildSelectElement(selQuestion.answerC);
  					selQuestion.text = selQuestion.text.replace(/@Blank@/, txt);
  				}
  				if (selQuestion.answerD != "" && selQuestion.answerD != null) {
  					var txt = buildSelectElement(selQuestion.answerD);
  					selQuestion.text = selQuestion.text.replace(/@Blank@/, txt);
  				}
  				if (selQuestion.answerE != "" && selQuestion.answerE != null) {
  					var txt = buildSelectElement(selQuestion.answerE);
  					selQuestion.text = selQuestion.text.replace(/@Blank@/, txt);
  				}
  				// more answer
  				if (selQuestion.answerF != "" && selQuestion.answerF != null) {
  					var txt = buildSelectElement(selQuestion.answerF);
  					selQuestion.text = selQuestion.text.replace(/@Blank@/, txt);
  				}
  				if (selQuestion.answerG != "" && selQuestion.answerG != null) {
  					var txt = buildSelectElement(selQuestion.answerG);
  					selQuestion.text = selQuestion.text.replace(/@Blank@/, txt);
  				}
  				if (selQuestion.answerH != "" && selQuestion.answerH != null) {
  					var txt = buildSelectElement(selQuestion.answerH);
  					selQuestion.text = selQuestion.text.replace(/@Blank@/, txt);
  				}
  				if (selQuestion.answerI != "" && selQuestion.answerI != null) {
  					var txt = buildSelectElement(selQuestion.answerI);
  					selQuestion.text = selQuestion.text.replace(/@Blank@/, txt);
  				}
  				if (selQuestion.answerJ != "" && selQuestion.answerJ != null) {
  					var txt = buildSelectElement(selQuestion.answerJ);
  					selQuestion.text = selQuestion.text.replace(/@Blank@/, txt);
  				}
  			}

  			// Update re-order
  			if (selQuestion.type == 'READING_RE_ORDER_PARAGRAPH') {
  				$scope.models.lists.Source = [];
  				$scope.models.lists.Target = [];
  				$scope.models.selected = null;
  				// Build models
  				if (selQuestion.answerA != "" && selQuestion.answerA != null) {
  					$scope.models.lists.Source.push({label: selQuestion.answerA, key: "A"});
  				}
  				if (selQuestion.answerB != "" && selQuestion.answerB != null) {
  					$scope.models.lists.Source.push({label: selQuestion.answerB, key: "B"});
  				}
  				if (selQuestion.answerC != "" && selQuestion.answerC != null) {
  					$scope.models.lists.Source.push({label: selQuestion.answerC, key: "C"});
  				}
  				if (selQuestion.answerD != "" && selQuestion.answerD != null) {
  					$scope.models.lists.Source.push({label: selQuestion.answerD, key: "D"});
  				}
  				if (selQuestion.answerE != "" && selQuestion.answerE != null) {
  					$scope.models.lists.Source.push({label: selQuestion.answerE, key: "E"});
  				}
  				// more question
  				if (selQuestion.answerF != "" && selQuestion.answerF != null) {
  					$scope.models.lists.Source.push({label: selQuestion.answerF, key: "F"});
  				}
  				if (selQuestion.answerG != "" && selQuestion.answerG != null) {
  					$scope.models.lists.Source.push({label: selQuestion.answerG, key: "G"});
  				}
  				if (selQuestion.answerH != "" && selQuestion.answerH != null) {
  					$scope.models.lists.Source.push({label: selQuestion.answerH, key: "H"});
  				}
  				if (selQuestion.answerI != "" && selQuestion.answerI != null) {
  					$scope.models.lists.Source.push({label: selQuestion.answerI, key: "I"});
  				}
  				if (selQuestion.answerJ != "" && selQuestion.answerJ != null) {
  					$scope.models.lists.Source.push({label: selQuestion.answerJ, key: "J"});
  				}
  			}
  			if (selQuestion.type == 'SPEAKING_REPEAT_SENTENCE' || selQuestion.type == 'SPEAKING_RETELL_LECTURE' || selQuestion.type == 'SPEAKING_ANSWER_SHORT_QUESTION') {
  				vm.showRecording = false;
  			}
            if (selQuestion.type == 'LISTENING_HIGHLIGHT_INCORRECT_WORD') {
                parseTextToWords(selQuestion.description);
            }
  		}

		function resetUserAnswer() {
			if (vm.selectedQuestion == null || vm.selectedQuestion == undefined) {
				return;
			}
			
  			if (vm.selectedQuestion.type == 'WRITING_SUMMARIZE_WRITTEN_TEXT' || vm.selectedQuestion.type == 'WRITING_ESSAY') {
  				// Reset
                $('#areaTextWriting').html('');
  			} else if (vm.selectedQuestion.type == 'LISTENING_FIB_L') {

  			} else if (vm.selectedQuestion.type == 'READING_RE_ORDER_PARAGRAPH') {

  			} else if (vm.selectedQuestion.type == 'READING_FIB_R_W') {

  			} else if (vm.selectedQuestion.type == 'READING_FIB_R') {
  				
  			} else if (vm.selectedQuestion.type == 'LISTENING_HIGHLIGHT_INCORRECT_WORD') {

  			} else if (vm.selectedQuestion.type == 'LISTENING_SUMMARIZE_SPOKEN_TEXT' || vm.selectedQuestion.type == 'LISTENING_DICTATION') { // 06/09/2018

  				// Reset
  				$('#areaTextWriting').val("");
                $('#areaTextWriting').html('');
  			} else {
  				angular.forEach(vm.listItemAnswer, function(value, key){
  	  				$("#answer" + value).prop( "checked", false );
  	            });
  				// Remove
  				$('input[type="radio"]').prop('checked', false);
  			}
		}
		
		function getUserAnswer() {
  			vm.answers = [];

  			if (vm.selectedQuestion.type == 'WRITING_SUMMARIZE_WRITTEN_TEXT' || vm.selectedQuestion.type == 'WRITING_ESSAY') {
  				var answer = $('#areaTextWriting').val();
  				vm.answers.push(answer);
  				// Reset
                $('#areaTextWriting').html('');
  			} else if (vm.selectedQuestion.type == 'LISTENING_FIB_L') {
  				$('.input_answer').each(function(){
  					vm.answers.push($(this).val());
  				 });
  			} else if (vm.selectedQuestion.type == 'READING_RE_ORDER_PARAGRAPH') {
  				var arrAnswer = $scope.models.lists.Target;
  				angular.forEach(arrAnswer, function(value, key){
  	  				vm.answers.push(value.key);
  	            });
  				console.log(vm.answers);
  			} else if (vm.selectedQuestion.type == 'READING_FIB_R_W') {
  				$('.select_READING_FIB_R_W').each(function(){
  					vm.answers.push($(this).find('option:selected').text());
  				});
  			} else if (vm.selectedQuestion.type == 'READING_FIB_R') {
  				var count = 0;
  				for (var name in $scope.models.answer) {
  				  if ($scope.models.answer.hasOwnProperty(name)) {
  					  var item = $scope.models.answer[name]
                      if(item[count] && item[count][0]) {
                          console.log(item[count][0].key);
                          vm.answers.push(item[count][0].key);
                          count++;
                      }
  				  }
  				}
  			} else if (vm.selectedQuestion.type == 'LISTENING_HIGHLIGHT_INCORRECT_WORD') {
  				$('.word-hightlight').each(function(){
  					if ($(this).hasClass('hightlight')) {
  						var answer = $.trim($(this).text());
  						vm.answers.push(answer);
  					}
  				});
  			} else if (vm.selectedQuestion.type == 'LISTENING_SUMMARIZE_SPOKEN_TEXT' || vm.selectedQuestion.type == 'LISTENING_DICTATION') { // 06/09/2018
  				var answer = $('#areaTextWriting').val();
  				vm.answers.push(answer);
  				// Reset
                $('#areaTextWriting').html('');
  			} else {
  				angular.forEach(vm.listItemAnswer, function(value, key){
  					let prefix = value;
  					if (vm.selectedQuestion.type == 'LISTENING_MCQ_L_SINGLE_ANSWER'
  						|| vm.selectedQuestion.type == 'LISTENING_HIGHLIGHT_CORRECT_SUMMARY'
  						|| vm.selectedQuestion.type == 'LISTENING_SELECT_MISSING_WORD') {
  						prefix = prefix + "1";
  					}
  	  				if ($('#answer' + prefix).is(":checked")) {
  	  	  				vm.answers.push(value);
  	  	  			}
  	  				$("#answer" + prefix).prop( "checked", false );
  	            });
  				// Remove
  				$('input[type="radio"]').prop('checked', false);
  			}
  		}

        function parseTextToWords(textToClear){
            // basic interpunct chars should be single elements to click
            textToClear = textToClear.replace(/\./g, ' .');
            textToClear = textToClear.replace(/\?/g, ' ?');
            textToClear = textToClear.replace(/\!/g, ' !');
            textToClear = textToClear.replace(/\,/g, ' ,');
            textToClear = textToClear.replace(/\"/g, ' " ');
            // removing multiple spaces for single
            textToClear = textToClear.replace(/ +(?= )/g,'');

            var words = textToClear.split(" ");

            vm.selectedQuestion.description = '';

            // generate words with ids to change their future css
            for ( var i = 0, l = words.length; i < l; i++ ) {
                var word = $('<span onclick="hightlight(this)" class="word-hightlight"/>').attr({'id':'word'+i }).html(" "+words[i]);
                word.css('color','black');
                vm.selectedQuestion.description += word.prop('outerHTML');
            }
        }

        function dropCallback(index, item, external, type, list, listName) {
            var parentIndex = parseInt(listName);
            if(list[0]) {
                $scope.models.fillInTheBlanklLists.questionPanel.push(list[0]);
            }
            document.getElementById('drag-panel'+ parentIndex).className = "panel panel-info ";
            $scope.models.answer['answer' + listName][listName] = [item];
            // Return false here to cancel drop. Return true if you insert the item yourself.
            return item;
        };

        function movedCallback(index, list, listName) {
            var parentIndex = parseInt(listName);
            list.splice(index, 1)
            document.getElementById('drag-panel'+ parentIndex).className = "panel panel-info pte-position-top10";
        };
        
        
        // convert wav -> mp3
        function uploadRecording(selectedQuestionId) {
        	console.log('uploadRecording, questionId:' + selectedQuestionId);
            var blobUrl = $("#save").attr('href');
            console.log(blobUrl);
            var xhr = new XMLHttpRequest();
            xhr.open('GET', blobUrl, true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function(e) {
                if (this.status == 200) {
                    var audioData  = this.response;
                    console.log(audioData);
                    
                    var start = new Date().getTime();

                    var wav = lamejs.WavHeader.readHeader(new DataView(audioData));
                    console.log('wav:', wav);
                    var samples = new Int16Array(audioData, wav.dataOffset, wav.dataLen / 2);
                    encodeMono(wav.channels, wav.sampleRate, samples, selectedQuestionId);
                    
                    var end = new Date().getTime();
                    console.log('convert mp3 done, time:' + (end - start));
                    
                    // myBlob is now the blob that the object URL pointed to.
                }
            };
            xhr.send();
        }
        
        function encodeMono(channels, sampleRate, samples, selectedQuestionId) {
            var buffer = [];
            var mp3enc = new lamejs.Mp3Encoder(channels, sampleRate, 128);
            var remaining = samples.length;
            var maxSamples = 1152;
            for (var i = 0; remaining >= maxSamples; i += maxSamples) {
                var mono = samples.subarray(i, i + maxSamples);
                var mp3buf = mp3enc.encodeBuffer(mono);
                if (mp3buf.length > 0) {
                    buffer.push(new Int8Array(mp3buf));
                }
                remaining -= maxSamples;
            }
            var d = mp3enc.flush();
            if(d.length > 0){
                buffer.push(new Int8Array(d));
            }
            console.log('done encoding, size=', buffer.length);
            var blob = new Blob(buffer, {type: 'audio/mp3'});
            
            // var filename = "recording_" + vm.exam.examDTO.id + "_" + selectedQuestionId + ".mp3";
            var filename = "recording_" + new Date().getTime() + "_" + selectedQuestionId + ".mp3";
            vm.fileUpload = new File([blob], filename);

            // save answer
            vm.saveAnswerSpeaking(selectedQuestionId, filename);
        }
        
        function setCountdownTimer() {
        	console.log('setCountdownTimer');
            if (vm.selectedQuestion.type == 'TIME_BREAK') {
                vm.countdown = PTE_SETTINGS.COUNT_DOWN_TIME_BREAK;
                $scope.$broadcast('timer-set-countdown-seconds', vm.countdown);
                return;
            }
            
            if (vm.examType == 'QUESTION_BANK') {
//            	if (vm.questionGroup == 'LISTENING') {
//                } else if (vm.questionGroup == 'WRITING') {
//                } else if (vm.questionGroup == 'READING') {
//                } else if (vm.questionGroup == 'SPEAKING') {
                	vm.countdown = 2 * 60;
                    $scope.$broadcast('timer-set-countdown-seconds', vm.countdown);
//                }
            } else {
            	if (vm.exam.examTypeDTO.type == 'MOCK_TEST_A' || vm.exam.examTypeDTO.type == 'MOCK_TEST_B' || vm.exam.examTypeDTO.type == 'MOCK_TEST_FULL') {
                    if (vm.questionGroup == 'LISTENING') {
                        if (vm.selectedQuestion.type == 'LISTENING_SUMMARIZE_SPOKEN_TEXT') {
                            vm.countdown = 10 * 60;
                            $scope.$broadcast('timer-set-countdown-seconds', vm.countdown);
                            $scope.$broadcast('timer-start');
                        } else {
                            if (vm.listeningTimerRunningFlag == false) {
                                vm.countdown = 22 * 60;
                                $scope.$broadcast('timer-set-countdown-seconds', vm.countdown );
                                $scope.$broadcast('timer-start');
                                vm.listeningTimerRunningFlag = true;
                            }
                        }
                    } else if (vm.questionGroup == 'WRITING') {
                        if (vm.selectedQuestion.type == 'WRITING_SUMMARIZE_WRITTEN_TEXT') {
                            vm.countdown = 10 * 60;
                            $scope.$broadcast('timer-set-countdown-seconds', vm.countdown);
                            $scope.$broadcast('timer-start');
                        } else if (vm.selectedQuestion.type == 'WRITING_ESSAY') {
                            vm.countdown = 20 * 60;
                            $scope.$broadcast('timer-set-countdown-seconds', vm.countdown );
                            $scope.$broadcast('timer-start');
                        }
                    } else if (vm.questionGroup == 'READING') {
                        if (vm.readingTimerRunningFlag == false) {
                            vm.countdown = 30 * 60;
                            $scope.$broadcast('timer-set-countdown-seconds', vm.countdown);
                            $scope.$broadcast('timer-start');
                            vm.readingTimerRunningFlag = true;
                        }
	            	} else if (vm.questionGroup == 'SPEAKING') {
	                    if (vm.speakingTimerRunningFlag == false) {
	                        vm.countdown = 35 * 60;
	                        $scope.$broadcast('timer-set-countdown-seconds', vm.countdown);
	                        $scope.$broadcast('timer-start');
	                        vm.speakingTimerRunningFlag = true;
	                    }
	                }
                } else {
                	// Skill test
                	if (vm.selectedQuestion.type == 'LISTENING_SUMMARIZE_SPOKEN_TEXT'
                		|| vm.selectedQuestion.type == 'WRITING_SUMMARIZE_WRITTEN_TEXT') {
                		vm.countdown = 10 * 60;
                    	// Count down
                    	$scope.$broadcast('timer-set-countdown-seconds', vm.countdown);
                    	$scope.$broadcast('timer-start');
                	} else if (vm.selectedQuestion.type == 'SPEAKING_READ_ALOUD'
                		|| vm.selectedQuestion.type == 'SPEAKING_REPEAT_SENTENCE'
            			|| vm.selectedQuestion.type == 'SPEAKING_DESCRIBE_IMAGE'
        				|| vm.selectedQuestion.type == 'SPEAKING_RETELL_LECTURE'
    					|| vm.selectedQuestion.type == 'SPEAKING_ANSWER_SHORT_QUESTION') {
                		vm.countdown = -1;
                    	// Count down
                    	// $scope.$broadcast('timer-set-countdown-seconds', vm.countdown);
                    	$scope.$broadcast('timer-stop');
                	} else if (vm.selectedQuestion.type == 'READING_FIB_R_W'
                		|| vm.selectedQuestion.type == 'READING_FIB_R'
            			|| vm.selectedQuestion.type == 'READING_RE_ORDER_PARAGRAPH'
        				|| vm.selectedQuestion.type == 'READING_MCQ_R_SINGLE_ANSWER'
    					|| vm.selectedQuestion.type == 'READING_MCQ_R_MULTIPLE_ANSWER') {
                		vm.countdown = 2 * 60;
                    	// Count down
                    	$scope.$broadcast('timer-set-countdown-seconds', vm.countdown);
                    	$scope.$broadcast('timer-start');
                	} else if (vm.selectedQuestion.type == 'LISTENING_FIB_L'
                		|| vm.selectedQuestion.type == 'LISTENING_MCQ_L_SINGLE_ANSWER'
            			|| vm.selectedQuestion.type == 'LISTENING_MCQ_L_MULTIPLE_ANSWER'
        				|| vm.selectedQuestion.type == 'LISTENING_HIGHLIGHT_CORRECT_SUMMARY'
    					|| vm.selectedQuestion.type == 'LISTENING_SELECT_MISSING_WORD'
						|| vm.selectedQuestion.type == 'LISTENING_HIGHLIGHT_INCORRECT_WORD'
						|| vm.selectedQuestion.type == 'LISTENING_DICTATION') {
                		vm.countdown = 90; // 1ph30s
                    	// Count down
                    	$scope.$broadcast('timer-set-countdown-seconds', vm.countdown);
                    	$scope.$broadcast('timer-start');
                	} else if (vm.selectedQuestion.type == 'WRITING_ESSAY') {
                		vm.countdown = 20 * 60; // 1ph30s
                    	// Count down
                    	$scope.$broadcast('timer-set-countdown-seconds', vm.countdown);
                    	$scope.$broadcast('timer-start');
                	} else {
                		vm.countdown = 2 * 60;                	// Count down
                    	$scope.$broadcast('timer-set-countdown-seconds', vm.countdown);
                    	$scope.$broadcast('timer-start');
                	}
                }
            }
        }
        
        $rootScope.$on('$stateChangeStart',function() {
        	vm.resetProgressStatus();
        	console.log('state change');
        });
        // http://jsrun.it/Mr.X/fWph
    }
})();
