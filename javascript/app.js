var app = angular.module("conectaCuatro",["ngAnimate"]);
app.controller("gameController",["$scope","$timeout",function($scope,$timeout){
    $scope.tablero = {
        rows : 6,
        columns : 7,
        fields : [],
        pieces : [],
        init : function(){
            this.fields = this.buildFields();
            this.pieces = this.buildPieces();
        },
        buildFields : function(){
            let fields = [];
            for(let cont=0; cont < this.rows; cont+=1){
                fields[cont] = [];
                for(let con=0; con < this.columns; con+=1){
                    fields[cont][con] = {
                        player : "-"
                    };
                }
            }
            return fields;
        },
        buildPieces : function (){
            let pieces = [];
            for(let cont=0; cont < this.columns; cont+=1){
                pieces[cont] = [];
            }
            return pieces;
        }
    };
    $scope.tablero.init();
    
    $scope.$watch('game.currentPlayer',function(newValue,oldValue){
        if($scope.game.winner === -1){
            if(newValue === 0){
                $scope.game.players[0].status = "moving";
                $scope.game.players[1].status = "waiting";
            }else{
                $scope.game.players[0].status = "waiting";
                $scope.game.players[1].status = "thinking";
                $timeout($scope.ai.active.func, 15);
            }
        }
    });
    
    $scope.$watch('game.winner',function(newValue,oldValue){
        if(newValue != -1){
            $scope.game.players[newValue.winner].status = "won";
            $scope.game.currentPlayer = newValue.winner;
            for(let cont=0; cont < $scope.tablero.columns; cont+=1){
                for(let con=0; con < $scope.tablero.pieces[cont].length; con+=1){
                    $scope.tablero.pieces[cont][con].klass = "hide";
                }
            }
            for(let cont = 0; cont < newValue.pieces.length ; cont+=1){
                let position = newValue.pieces[cont];
                $scope.tablero.pieces[position.column][position.row].klass = "";
            }
        }
    });
    
    $scope.ai = {
        active : 0,
        options : [
            {
                name : "Brute Force AI",
                func : function(){
                    let limit = $scope.utilities.getMaxHeightOfPlayer($scope.tablero.fields);
                    console.log(limit);
                    $scope.bruteForceAI.hybrid($scope.tablero.fields,1,[[],[]],limit);
                    let final_0 = $scope.bruteForceAI.results[0];
                    let final_1 = $scope.bruteForceAI.results[1];
                    for(let cont = 0; cont < $scope.bruteForceAI.results.length ; cont+=1){
                        if(final_0.steps[0].length > $scope.bruteForceAI.results[cont].steps[0].length){
                            final_0 = $scope.bruteForceAI.results[cont];
                        }
                        if(final_1.steps[1].length > $scope.bruteForceAI.results[cont].steps[1].length){
                            final_1 = $scope.bruteForceAI.results[cont];
                        }
                    }
                    let final = undefined;
                    if(!final_1.steps[1]){
                        final = final_0;
                    }else{
                        if(!final_0.steps[0]){
                            final = final_1;
                        }else{
                            if((final_1.steps[1].length + 1) > final_0.steps[0].length){
                                final = final_0;
                            }else{
                                final = final_1;
                            }
                        }
                    }

                    console.log(final);
                    $scope.game.printBoard(final.board);
                    if(final.result.winner){
                        $scope.game.addPiece(final.steps[final.result.winner][final.steps[final.result.winner].length-1]);
                    }else{
                        let patch = final.steps[final.result.winner][final.steps[final.result.winner].length-1];
                        if(patch){
                            $scope.game.addPiece(patch);
                        }else{
                            $scope.game.addPiece(final.steps[1][0]);
                        }
                    }
                    $scope.bruteForceAI.results = [];
                }
            },
            {
                name : "Greedy AI",
                func : function(){
                    let decision = $scope.informedAI.greedy($scope.tablero.fields,1);
                    let vectors = decision.vectors[0];
                    let final = decision.column;
                    for(let cont = 0; cont < vectors.length ; cont+=1){
                        if(vectors[cont].empty === 1){
                            let positions = vectors[cont].vectors;
                            let column = positions[0].position.column;
                            let row = positions[0].position.row;
                            let co = 0;
                            let ro = 0;
                            let space = 0;
                            for(let con = 0; con < positions.length; con+=1){
                                let position = positions[con];
                                if(column === position.position.column){
                                    co+=1;
                                }
                                if(row === position.position.row){
                                    console.log(positions);
                                    ro+=1;
                                    
                                }
                                if(position.player === "-"){
                                    space = position.position.column;
                                }
                            }

                            if(co === 4 || ro === 4){
                                final = space;
                                cont = vectors.length;
                            }
                        }
                    }
                    $scope.game.addPiece(final);
                }
            }
        ]
    };
    $scope.ai.active = $scope.ai.options[1];
    $scope.$watch('ai.active',function(newValue,oldValue){
        $scope.ai.active = newValue;
    });
    
    $scope.game = {
        currentPlayer : 0,
        winner : -1,
        players : [
            {
                status : "-",
                ficha: "./static/images/ficha_1.svg"
            },
            {
                status : "-",
                ficha: "./static/images/ficha_2.svg"
            }
        ],
        addPieceToBoard: function(column,player,board,max){
            let limit = max ? max : $scope.tablero.rows;
            let row = limit; 
            for(let cont=0; cont < limit ; cont+=1){
                if(board[cont][column].player === "-"){
                    row = cont;
                    cont = $scope.tablero.rows;
                }
            }
            if(row < limit){
                board[row][column].player = player;
                return true;
            }
            return false;
        },
        addPiece: function(column){
            if(this.winner === -1){
                if(this.addPieceToBoard(column,this.currentPlayer,$scope.tablero.fields)){
                    $scope.tablero.pieces[column].push({
                        player : this.currentPlayer,
                        klass : ""
                    });
                    this.currentPlayer = this.currentPlayer ? 0 : 1;
                    let result = this.judgeBoard($scope.tablero.fields);
                    if(result){
                        this.winner = result;
                    }
                }else{
                    console.log("COLUMN LIMIT");
                }
            }
        },
        possibleVectors : function(board){
            let result = [[],[]];
            result[0] = result[0].concat(this.possibleHorizontalAllignments(board,0));
            result[0] = result[0].concat(this.possibleVerticalAllignments(board,0));
            result[0] = result[0].concat(this.possibleDiagonalAllignments(board,0));
            result[1] = result[1].concat(this.possibleHorizontalAllignments(board,1));
            result[1] = result[1].concat(this.possibleVerticalAllignments(board,1));
            result[1] = result[1].concat(this.possibleDiagonalAllignments(board,1));
            return result;
        },
        possibleHorizontalAllignments: function(board,player){
            let outFor = {
                limit: $scope.tablero.rows
            };
            let inFor = {
                limit: $scope.tablero.columns
            };
            let result = $scope.utilities.simpleHeuristicTemplate(outFor,inFor,player,$scope.utilities.horizontalAssigner,board);
            return result;
        },
        possibleVerticalAllignments : function(board,player){
            let outFor = {
                limit: $scope.tablero.columns
            };
            let inFor = {
                limit: $scope.tablero.rows
            };
            let result = $scope.utilities.simpleHeuristicTemplate(outFor,inFor,player,$scope.utilities.verticalAssigner,board);
            return result;
        },
        possibleDiagonalAllignments : function(board,player){
            
            let outFor = {
                limit: $scope.tablero.rows
            };
            let inFor = {
                limit: $scope.tablero.rows,
                init: function(cont){
                    return cont;
                }
            };
            let result = $scope.utilities.simpleHeuristicTemplate(outFor,inFor,player,$scope.utilities.diagonalLRBAssigner,board);
        
            outFor = {
                init: 1,
                limit: $scope.tablero.columns
            };
            inFor = {
                limit: $scope.tablero.columns,
                init: function(cont){
                    return cont;
                }
            };
            result = result.concat($scope.utilities.simpleHeuristicTemplate(outFor,inFor,player,$scope.utilities.diagonalLRTAssigner,board));
            
            outFor = {
                limit: $scope.tablero.rows,
                secInit: function(cont){
                    return $scope.tablero.columns-1;
                },
                secStep: -1
            };
            inFor = {
                limit: $scope.tablero.rows,
                init: function(cont){
                    return cont;
                }
            };
            result = result.concat($scope.utilities.simpleHeuristicTemplate(outFor,inFor,player,$scope.utilities.diagonalRLBAssigner,board));
        
            outFor = {
                limit: $scope.tablero.rows
            };
            inFor = {
                limit: $scope.tablero.rows,
                init: function(cont){
                    return cont;
                }
            };
            result = result.concat($scope.utilities.simpleHeuristicTemplate(outFor,inFor,player,$scope.utilities.diagonalRLTAssigner,board));
            return result;
        },
        judgeBoard: function(board){
            let result = this.judgeHorizontalAllignments(board);
            if(!result){
                result = this.judgeVerticalAllignments(board);
            }
            if(!result){
                result = this.judgeDiagonalAllignments(board);
            }
            return result;
        },
        judgeVerticalAllignments : function(board){
            let outFor = {
                limit: $scope.tablero.columns
            };
            let inFor = {
                limit: $scope.tablero.rows
            };
            let result = $scope.utilities.simpleJudgeTemplate(outFor,inFor,$scope.utilities.verticalAssigner,board);
            return result.pieces.length === 4 ? result : undefined;
        },
        judgeHorizontalAllignments : function(board){
            let outFor = {
                limit: $scope.tablero.rows
            };
            let inFor = {
                limit: $scope.tablero.columns
            };
            let result = $scope.utilities.simpleJudgeTemplate(outFor,inFor,$scope.utilities.horizontalAssigner,board);
            return result.pieces.length === 4 ? result : undefined;
        },
        judgeDiagonalAllignments : function(board){
            
            let outFor = {
                limit: $scope.tablero.rows
            };
            let inFor = {
                limit: $scope.tablero.rows,
                init: function(cont){
                    return cont;
                }
            };
            let result = $scope.utilities.simpleJudgeTemplate(outFor,inFor,$scope.utilities.diagonalLRBAssigner,board);
            result = result.pieces.length === 4 ? result : undefined;
        
            if(!result){
                outFor = {
                    init: 1,
                    limit: $scope.tablero.columns
                };
                inFor = {
                    limit: $scope.tablero.columns,
                    init: function(cont){
                        return cont;
                    }
                };
                result = $scope.utilities.simpleJudgeTemplate(outFor,inFor,$scope.utilities.diagonalLRTAssigner,board);
                result = result.pieces.length === 4 ? result : undefined;
            }
            
            
            if(!result){
                outFor = {
                    limit: $scope.tablero.rows,
                    secInit: function(cont){
                        return $scope.tablero.columns-1;
                    },
                    secStep: -1
                };
                inFor = {
                    limit: $scope.tablero.rows,
                    init: function(cont){
                        return cont;
                    }
                };
                result = $scope.utilities.simpleJudgeTemplate(outFor,inFor,$scope.utilities.diagonalRLBAssigner,board);
                result = result.pieces.length === 4 ? result : undefined;
            }
        
            if(!result){
                outFor = {
                    limit: $scope.tablero.rows
                };
                inFor = {
                    limit: $scope.tablero.rows,
                    init: function(cont){
                        return cont;
                    }
                };
                result = $scope.utilities.simpleJudgeTemplate(outFor,inFor,$scope.utilities.diagonalRLTAssigner,board)
            }
            
            return result.pieces.length === 4 ? result : undefined;
        },
        printBoard: function(board){
            let str = "";
            str += "   |"
            for(let cont=0; cont < $scope.tablero.columns; cont+=1){
                str += " " + cont +" ";
            }
            str += "\n----";
            for(let cont=0; cont < $scope.tablero.columns; cont+=1){
                str += "---";
            }
            str += "\n";
            for(let cont=0; cont < $scope.tablero.rows; cont+=1){
                str += " " + cont + " |";
                for(let con=0; con < $scope.tablero.columns; con+=1){
                    let exp = " "+ board[cont][con].player + " ";
                    str+=exp;
                }
                str+="\n";
            }
            console.log(str);
            console.log("*****************************************************");
        }
    };
    
    $scope.utilities = {
        horizontalAssigner: function(cont,con,co){
            return {
                row: cont,
                column: con
            };
        },
        verticalAssigner: function(cont,con,co){
            return {
                row: con,
                column: cont
            };
        },
        diagonalLRBAssigner: function(cont,con,co){
            return {
                row: con,
                column: co
            };
        },
        diagonalLRTAssigner: function(cont,con,co){
            return {
                row: co,
                column: con
            };
        },
        diagonalRLBAssigner: function(cont,con,co){
            return {
                row: con,
                column: co
            };
        },
        diagonalRLTAssigner: function(cont,con,co){
            return {
                row: co,
                column: ($scope.tablero.rows - con - 1)
            };
        },
        simpleJudgeTemplate : function(outFor,inFor,positionAssigner,board){
            let list = [];
            let playerContesting = 0;
            for(let cont = outFor.init ? outFor.init : 0; cont < outFor.limit; cont += outFor.step ? outFor.step : 1){
                let co = outFor.secInit ? outFor.secInit(cont) : 0;
                list = [];
                playerContesting = 0;
                for(let con= inFor.init ? inFor.init(cont,co) : 0; con < inFor.limit; con += inFor.step ? inFor.step : 1){
                    let position = positionAssigner(cont,con,co);
                    let currentPlayer = board[position.row][position.column].player;
                    if(currentPlayer !== "-"){
                        if(currentPlayer !== playerContesting){
                            list = [];
                            playerContesting = currentPlayer;
                        }
                        list.push(position);
                        if(list.length >= 4){
                            con=inFor;
                            cont=outFor;
                        }
                    }else{
                        list = [];
                        playerContesting = 0;
                    }
                    co += outFor.secStep ? outFor.secStep : 1;
                }
            }
            return {
                winner: list.length ? playerContesting : -1,
                pieces: list
            };
        },
        simpleHeuristicTemplate : function(outFor,inFor,player,positionAssigner,board){
            let list = [];
            for(let cont = outFor.init ? outFor.init : 0; cont < outFor.limit; cont += outFor.step ? outFor.step : 1){
                let co = outFor.secInit ? outFor.secInit(cont) : 0;
                let vector = [];
                let empty = 0;
                for(let con= inFor.init ? inFor.init(cont,co) : 0; con < inFor.limit; con += inFor.step ? inFor.step : 1){
                    let position = positionAssigner(cont,con,co);
                    let currentPlayer = board[position.row][position.column].player;
                    if(currentPlayer === "-" || currentPlayer === player){
                        vector.push({
                            player : currentPlayer,
                            position : position
                        });
                        empty += currentPlayer === "-" ? 1 : 0;                        
                        if(vector.length === 4){
                            if(vector.length === empty){
                                vector.shift();
                                empty-=1;
                            }else{
                                list.push({
                                    vectors : vector.slice(),
                                    empty : empty
                                });
                                let primero = vector.shift();
                                if(primero.player === "-"){
                                    empty-=1;
                                }
                            }
                        }
                    }else{
                        vector = [];
                        empty = 0;
                    }
                    co += outFor.secStep ? outFor.secStep : 1;
                }
            }
            return list;
        },
        cloneBoard : function(board){
            let fields = [];
            for(let cont=0; cont < $scope.tablero.rows; cont+=1){
                fields[cont] = [];
                for(let con=0; con < $scope.tablero.columns; con+=1){
                    fields[cont][con] = {
                        player : board[cont][con].player
                    };
                }
            }
            return fields;
        },
        cloneSteps : function(steps){
            let copy = [];
            for(let cont=0; cont < steps.length; cont+=1){
                copy[cont] = [];
                for(let con=0; con < steps[cont].length; con+=1){
                    copy[cont][con] = steps[cont][con];
                }
            }
            return copy;
        },
        randomVector : function(size){
            let nums = [];
            for(let cont = 0; cont < size ; cont+=1){
                nums.push(cont);
            }
            let randos = [];
            while(nums.length){
                randos.push(nums.splice(Math.floor((Math.random() * nums.length)),1)[0]);
            }
            return randos;
        },
        getMaxHeightOfPlayer : function(board){
            let limit = 0;
            let colmax = [];
            for(let cont = 0; cont < $scope.tablero.columns ; cont += 1){
                colmax[cont] = 0;
                for(let con = 0; con < $scope.tablero.rows-1 ; con += 1){
                    if(board[con][cont].player === 0){
                        colmax[cont] = con + 1;
                        if(board[con+1][cont].player === 1){
                            colmax[cont] -=1 ;
                        }
                    }
                }
            }
            for(let cont = 0; cont < colmax.length ; cont+=1){
                if(limit < colmax[cont]){
                    limit = colmax[cont]; 
                }
            }
            limit+=1;
            return limit;
        }
    };
    
    $scope.informedAI = {
        greedy : function(board,player){
            let solutions = [];
            for(let cont = 0; cont < $scope.tablero.columns; cont+=1){
                let newBoard = $scope.utilities.cloneBoard(board);
                if($scope.game.addPieceToBoard(cont,player,newBoard)){
                    let vectors = $scope.game.possibleVectors(newBoard);
                    solutions.push({
                        vectors : vectors,
                        column : cont,
                        board : newBoard
                    });
                }
            }
            solutions.sort(function(a,b){
                let comp = a.vectors[0].length - b.vectors[0].length;
                if(comp !== 0){
                    return comp;
                }
                return b.vectors[1].length - a.vectors[1].length
            });
            return solutions[0];
        }
    };
    
    $scope.bruteForceAI = {
        hybrid : function(board,player,steps,limit){
            let result = $scope.game.judgeBoard(board);
            let play = player;
            if(result){
                this.results.push({
                    steps : steps,
                    result : result,
                    board : board
                });
            }else{
                let random = $scope.utilities.randomVector($scope.tablero.columns);
                for(let cont = 0; cont < $scope.tablero.columns; cont+=1){
                    let newBoard = $scope.utilities.cloneBoard(board);
                    let column = random[cont];
                    if($scope.game.addPieceToBoard(column,player,newBoard,limit)){
                        let newSteps = $scope.utilities.cloneSteps(steps);
                        newSteps[play].push(column);
                        this.hybrid(newBoard,player ? 0 : 1,newSteps,limit);
                        if(this.results.length >= 50000){
                            break;
                        }
                    }
                }
                for(let cont = 0; cont < $scope.tablero.columns; cont+=1){
                    let newBoard = $scope.utilities.cloneBoard(board);
                    let column = random[cont];
                    if($scope.game.addPieceToBoard(column,player,newBoard,limit)){
                        let newSteps = $scope.utilities.cloneSteps(steps);
                        newSteps[play].push(column);
                        this.hybrid(newBoard,player ? 0 : 1,newSteps,limit);
                        if(this.results.length >= 15000 * limit){
                            break;
                        }
                    }
                }
            }
        },
        results : [],
    };
}]);