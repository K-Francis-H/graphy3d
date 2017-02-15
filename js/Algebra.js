//Algebra.js
//This Object takes in an algebraic expression and translates it to 
//ready-to-execute javascript, including support for exponentiation,
//implicit multiplication, and built in JS functions.
//TODO clean code up, use found vars to build regex for implicit mul, exp, etc

//TODO add execute function:
/*
function execute(start, end, [step]){
 //check that start < end
    if not flip vals or throw error
 //if step === undefined
     var step = 1
 //fetch var names
 for each var name
    for var i=start; i < end; i+=step
       //compute value with given vars 
       //store vars as well for verts... maybe
  return value array
*/
 
function Algebra(expression){

   var error = false;
   var errorString = "";
   var vars = findVars(expression); //get vars in string from uncleaned expression
   var rawExpression = expression;
   rawExpression = rawExpression.toLowerCase(); //a little less raw (prevents errors from Sin(x), cOs(y), etc
   var expression = cleanExpression(rawExpression, vars);
   //this.vars = getVars(this.expression);
   console.log("found variables: "+vars);

   this.getJS = function(){
      return expression;
   }
   this.getAlgebra = function(){
      return rawExpression;
   }
   this.getVars = function(){
      return vars;
   }
   this.isError = function(){
      return error;
   }
   this.getErrorString = function(){
      return errorString;
   }

/******************************************************
*
*	PRIVATE FUNCTIONS
*
******************************************************/

   //returns a string of all variables in the expression
   function findVars(expression){
      /*capitalize function names to leave vars as lowercase*/
      expression = expression.replace( /asin/g, "ASIN")
                             .replace( /acos/g, "ACOS")
                             .replace( /atan/g, "ATAN")
                             .replace( /sqrt/g, "SQRT")
                             .replace( /sin/g, "SIN")
                             .replace( /cos/g, "COS")
                             .replace( /tan/g, "TAN")
                             .replace( /pow/g, "POW")
                             .replace( /abs/g, "ABS")
                             .replace( /log/g, "LOG")
                             .replace( /exp/g, "EXP");

      var rawVars = expression.match( /[a-z]/g );
      vars = "";
      if( rawVars === null ){
         return "";
      }
      for(var i=0; i < rawVars.length; i++)
          if( !isIn(vars, rawVars[i]) )
             vars += rawVars[i];
      
      function isIn(arr, char){
         for(var i=0; i < arr.length; i++)
           if(arr[i] === char)
              return true;
         return false;
      }

      return vars;
   }/*end function findvars()*/

   function unevenParentheses(expression){
      var count = 0;
      for(var i=0; i < expression.length; i++)
         if( expression[i] === '(' || expression[i] === ')' )
            count++;
      if( count % 2 === 0 )
         return false;
      else 
         return true;
   }/*end function unevenParentheses()*/

   function syntaxError(expression){
      /*if empty parentheses or double operators ==> syntax error*/
      /*CHECKS FOR THESE ERRORS
         double operators: ^^, +/, --, *+, etc.
         multiple radices: 3.56.12
         empty parentheses: () 
      */
      if( expression.match( /[\.\(\+\-\*\/\^][\)\+\-\*\/\^]|[0-9]*\.[0-9]\.[0-9]*/g ) )
         return true;
      /*if first or last char is a closing or opening parentheses respectively ==> syntax error*/
      if( expression[0] === ')' || expression[expression.length-1] === '(' )
         return true;
      /*otherwise no errors*/
      return false;
   }/*end function syntaxError()*/

   /*********************************************
   *cleanExpression()
   *
   *params:
   *	expression : String - a raw algebraic expression 
   *    vars       : String - a string containing each of the variables in 'expression'
   *
   *function:
   *	cleans expression and checks for errors. If errors are found Algebra.error is
   *    set to true and Algebra.errorStr has the error concatenated to it. If no errors
   *    are found expression is translated into a JavaScript expression that may be executed.
   *
   *returns:
   *	executable JavaScript expression : String
   *********************************************/
   function cleanExpression(expression, vars){

      /*remove all whitespace*/
      expression = expression.replace( /\s/g, "");
     
      /*check for unbalanced parentheses*/
      if( unevenParentheses(expression) ){
         error = true;
         errorString += "ERROR: Unbalanced Parentheses\n";
         console.log(errorString);
         return;
      }
      /*check for syntax errors*/
      if( syntaxError(expression) ){
         error = true;
         errorString += "ERROR: Syntax Error\n";
         console.log(errorString);
         return;
      }

      /************************************************************************
      /*if algebra expression reaches this point it is a well-formed expression
      /***********************************************************************/

      /*find '^' exponentiation and replace with Math.pow()*/
      var index = expression.indexOf('^');
      var isError = false;
      while( index > -1){
         var left = getLeftOperand(expression, index);
         console.log("left op: "+left);
         var right = getRightOperand(expression, index);
         console.log("right op: "+right);
         /*replace found exponentiation string with JS equivalent*/
         expression = expression.replace( left+"^"+right, "pow("+left+","+right+")");
         /*find next exponentiation*/
         index = expression.indexOf('^');
      }
      
      /*temporarily hide function names so they are not incorporated in implicit multiplication regex*/
      expression = expression.replace( /asin/g, "ASIN")
                             .replace( /acos/g, "ACOS")
                             .replace( /atan/g, "ATAN")
                             .replace( /sqrt/g, "SQRT")
                             .replace( /sin/g, "SIN")
                             .replace( /cos/g, "COS")
                             .replace( /tan/g, "TAN")
                             .replace( /pow/g, "POW")
                             .replace( /abs/g, "ABS")
                             .replace( /log/g, "LOG")
                             .replace( /exp/g, "EXP");

      /*IMPLICIT MULTIPLICATION*/
      var re = new RegExp( "(["+vars+")]|[0-9])(?=[^\^*+-/,).0-9])", "g");/*for cases like 8x, xsin(), 7(), x()*/
      expression = expression.replace( re, '$&*' );
      re = new RegExp("(["+vars+")])(?=[0-9])", "g");
      expression = expression.replace( re, '$&*'); /*for cases like x9 or sin()4*/

      /*restore function names*/
      expression = expression.replace( /ATAN/g, "atan")
			     .replace( /ACOS/g, "acos")
                             .replace( /ASIN/g, "asin")
                             .replace( /SQRT/g, "sqrt")
                             .replace( /SIN/g, "sin")
                             .replace( /COS/g, "cos")
                             .replace( /TAN/g, "tan")
                             .replace( /POW/g, "pow")
                             .replace( /ABS/g, "abs")
                             .replace( /LOG/g, "log")
                             .replace( /EXP/g, "exp");
      /*append Math. to all function names*/
      expression = expression.replace( /asin|atan|acos|sqrt|abs|pow|exp|log|sin|cos|tan/g, "Math.$&");
      return expression;
   }/*end cleanExpression()******************************************************************************/

   //functions
   this.setVars = function(vars){
      this.vars = "";
      for(var i=0; i < vars.length; i++)
         this.vars[i] = vars[i];
   }

function isVar( char){
   console.log("this.vars "+vars);
   if( char === undefined)
      return false;
   if( char.match( new RegExp( "["+vars+"]" ) ) !== null )
      return true;
   return false;
}

function isNum(char){
   if( char === undefined)
      return false;
   if( char.match( /[0-9\.]/ ) !== null)
      return true;
   return false;
}
//TODO TODO TODO TODO TODO TODO TODO clean up functions below...

/*getLeftOperand(expression : String, index : Number )
*-finds left hand operand of the exponentiation operator '^'
*by considering three cases:
*
*1.) operand is a variable
*2.) operand is a constant number
*3.) operand is an expression or function
*
*returns an Object with these attributes:
*found     : String, the found operand may have erroneous parentheses
*corrected : String, the corrected operand if found has erroneous parentheses
*
*in case that found is error free, found === corrected
*/
function getLeftOperand(expression, index){
   console.log("getLeftOperand exp="+expression+" index="+index);
   var leftOperand = new Object();
   var startIndex = index; /*used in case of unbalanced parenthetical for recursion*/
   var operand = new Array();
   var finished = false;
   //while(!finished){
      var curChar = expression[--index];
      console.log("curChar= "+curChar);
      //alert(curChar);
      if( isVar(curChar) ){
         console.log("isVar");
         finished = true;
         return curChar;
      }
      else if( isNum(curChar) ){
         operand.push(curChar);
         curChar = expression[--index];
         while( isNum(curChar) ){
            operand.push(curChar);
            curChar = expression[--index];
         }
         finished = true;
      }
      else if( curChar === ")" ){//TODO report unbalanced expression if loop goes infinite
         console.log("here )");
         var pDepth = 1; //parentheses depth
         operand.push(curChar);
         curChar = expression[--index];
         while( pDepth > 0 && index > -1){
            //curChar = expression[--index];
            if( curChar === ')'){
               pDepth++;
            }
            else if( curChar === '(' ){
               pDepth--;
            }
            operand.push(curChar);
            curChar = expression[--index];
         }
         //error check TODO not always true yo
         if(pDepth > 0){
            alert("unbalanced parentheses");
            for( ; pDepth > 0; pDepth--){ 
               expression = expression.replace( ")", "");
               startIndex--;/*offset startIndex to account for removal of parentheses*/
               console.log("after removal: "+expression);
            }
            console.log("entering recursion");
            leftOperand.corrected = getLeftOperand(expression, startIndex).found;
            //console.log("recursion complete, op= "+opStr);
            //return opStr;
         }
         //now find if we were in a function
         // sin, cos, tan, atan, asin, acos, sqrt, ln, exp, pow, abs
         //TODO

         if(index >= 3){//if we have at least 4 chars ahead
            var sub = expression.substring(index-3, index+1);
            console.log("subexpression: "+sub+" index: "+index);
            var mat = sub.match( /asin|atan|acos|sqrt/ );
            if( mat !== null)
               operand.push(new String(mat));
            else{
               mat = sub.match( /sin|cos|tan|exp|pow|abs|ln/ );
               if( mat !== null)
                 operand.push(new String(mat));
            }
         }
         else if(index >=2){//if we have at least 3 chars
            var sub = expression.substring(index-2, index+1);
            var mat = sub.match( /sin|cos|tan|ln|exp|pow|abs/ );
            if( mat !== null)
               operand.push(new String(mat));
         }
         else if(index >= 1){
            var sub = expression.substring(index-1, index+1);
            var mat = sub.match( /ln/ );
            if( mat !== null)
               operand.push(new String(mat));
         }
         finished = true;
      }
      finished = true;
   //}//end while
   console.log("left operand: "+operand);
   //now flip array to rebuild operand
   var opString = "";
   for(var i = operand.length-1; i > -1; i--){
      opString += operand[i];
   }
   leftOperand.found = opString;
   if( !leftOperand.corrected ){//if the parentheses are properly balanced
       leftOperand.corrected = opString;
   }
   return opString;
}//end getLeftOperand()

function getRightOperand(expression, index){
   var rightOperand = new Object();
   var startIndex = index; /*used for recursion if unbalanced parenthetical (return fixed expression)*/
   var operand = new Array();
   var finished = false;
   var curChar = expression[++index];
      if( isVar(curChar) )
         return curChar;
      else if( isNum(curChar) ){
         operand.push(curChar);
         curChar = expression[++index];
         while( isNum(curChar) ){
            operand.push(curChar);
            curChar = expression[++index];
         }
         finished = true;
      }
      else if( curChar === '(' ){//TODO report unbalanced expression if loop goes infinite
         var pDepth = 1; //parentheses depth
         operand.push(curChar);
         curChar = expression[++index];
         while( pDepth > 0 && index < expression.length ){
            //curChar = expression[--index];
            if( curChar === ')'){
               pDepth--;
            }
            else if( curChar === '(' ){
               pDepth++;
            }
            operand.push(curChar);
            curChar = expression[++index];
         }
         /*check for unbalanced parentheses*/
         if(pDepth > 0){
            alert("unbalanced parentheses");
            for( ; pDepth > 0; pDepth--){ 
               expression = expression.replace( "(", "");
            }
            rightOperand.corrected = getRightOperand(expression, startIndex).found;
         }
      }
      else{//see if its a function
         //no length check because even ln() is 4 chars, other possibility is that this is a malformed expression
         var sub = expression.substring(index, index+3);
         console.log("sub: "+sub);
         var mat = sub.match( /asin|acos|atan|sin|cos|tan|exp|abs|ln|pow/ );
         if( mat !== null)
            operand.push(new String(mat) );
         index += new String(mat).length-1;
         console.log("mat len: "+mat.length);
         console.log(index);
         var pDepth = 1; //parentheses depth

         curChar = expression[++index];//TODO
         operand.push(curChar); //push first parenthesis
         console.log("curChar before pDepth loop: "+curChar);
         var bflag = 10
         while( pDepth > 0 && index < expression.length && bflag > 0){//pDepth > 0 ){
            curChar = expression[++index];
            console.log("len: "+expression.length+" index: "+index);
            //console.log("loopchar1: "+curChar);
            if( curChar === ")"){
               //console.log("here")
               pDepth--;
            }
            else if( curChar === '(' ){
               pDepth++;
            }
            //otherwise just push the symbol
            operand.push(curChar);
            //curChar = expression[++index];
            //console.log("loopchar2: "+curChar);
            //console.log(pDepth);
            bflag--;
         }
         //error checking
         if(pDepth > 0){
            console.log("unbalanced parentheses");
            for( ; pDepth > 0; pDepth--){ 
               expression = expression.replace( "(", "");
            }
            rightOperand.corrected = getRightOperand(expression, startIndex).found;
            //return "ERROR";
         }
      }         


   //now flip array to rebuild operand
   var opString = "";
   for(var i = 0; i < operand.length; i++){
      opString += operand[i];
   }
   console.log(opString);
   rightOperand.found = opString;
   if( !rightOperand.corrected ){//if the parentheses are properly balanced
       rightOperand.corrected = opString;
   }
   return opString;    
}  

}//end Algebra.js


