define([
    './WKTElements',
    './geom/WKTObject',
    './WKTType'
], function (WKTElements,
             WKTObject,
             WKTType) {
    /**
     * Tokenizer, which parses the source texts into the meaningful tokens and then transforms them to the objects.
     * Intended for the internal use only.
     * @private
     * @constructor
     */
    var WKTTokens = function (sourceText) {
        this.sourceText = sourceText;
    };

    /**
     * It returns correctly initialized objects. It is possible to retrieve relevant shapes from all WKT Objects.
     * @return {WKTObject[]}
     */
    WKTTokens.prototype.objects = function () {
        var currentObject;
        var objects = [];

        this.tokenize(this.sourceText).forEach(function (token) {
            if(currentObject && currentObject.isFinished() || !currentObject) {
                // It represents new object.
                var value = token.value;
                var founded = value.match('[M]?[Z]?$');
                if(founded && founded.length > 0 && founded[0] != '') {
                    value = value.substring(0, value.length - founded.length);
                }

                currentObject = WKTElements[value] && new WKTElements[value]();
                if(!currentObject) {
                    currentObject = new WKTObject();
                }

                if(founded && founded.length > 0 && founded[0] != '') {
                    currentObject.setOptions(founded[0], currentObject);
                }
                objects.push(currentObject);
            } else {
                currentObject.handleToken(token);
            }
        });

        return objects;
    };

    /**
     * It continues character by character through the string. The empty spaces works always as delimiter.
     * It begins with the information about the type. It is one of the WKT types with potential ending with M or Z
     * I have the complete tokens containing the basic information we need.
     * @private
     * @return {String[]}
     */
    WKTTokens.prototype.tokenize = function (textToParse) {
        this.currentPosition = 0;

        var tokens = [];
        for (; this.currentPosition < textToParse.length; this.currentPosition++) {
            var c = textToParse.charAt(this.currentPosition);

            if (c == '(') {
                tokens.push({
                    type: WKTType.TokenType.LEFT_PARENTHESIS
                })
            } else if (c == ',') {
                tokens.push({
                    type: WKTType.TokenType.COMMA
                })
            } else if (c == ')') {
                tokens.push({
                    type: WKTType.TokenType.RIGHT_PARENTHESIS
                })
            } else if (this.isAlpha(c)) {
                var text = this.readText(textToParse);
                tokens.push({
                    type: WKTType.TokenType.TEXT,
                    value: text
                })
            } else if (this.isNumeric(c)) {
                var numeric = this.readNumeric(textToParse);
                tokens.push({
                    type: WKTType.TokenType.NUMBER,
                    value: numeric
                })
            } else if (this.isWhiteSpace(c)) {
                continue;
            } else {
                throw new Error('Invalid character: {{', c, '}}');
            }
        }

        return tokens;
    };


    /**
     * It returns true if the character is letter, regardless of whether uppercase or lowercase.
     * @private
     * @param c {String} character to test
     * @return {boolean} True if it is lowercase or uppercase
     */
    WKTTokens.prototype.isAlpha = function (c) {
        return c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z';
    };

    /**
     * It returns true if the character is part of the number. It has certain limitations such as -1- is considered as
     * a number
     * @private
     * @param c {String} character to test
     * @return {boolean} True if it is either Number or - or .
     */
    WKTTokens.prototype.isNumeric = function (c) {
        return c >= '0' && c <= '9' || c == '.' || c == '-';
    };

    /**
     * It returns true if the character represents whitespace. It is mainly relevant as whitespaces are one of the
     * delimiters
     * @private
     * @param c {String} character to test
     * @return {boolean} True if it is any type of white space.
     */
    WKTTokens.prototype.isWhiteSpace = function (c) {
        return c == ' ' || c == '\t' || c == '\r' || c == '\n';
    };

    /**
     * It returns the next chunk of the String, which represents the text. Non alpha characters end the text.
     * @private
     * @param textToParse {String} The text to use in parsing.
     * @return {string} The full chunk of text
     */
    WKTTokens.prototype.readText = function (textToParse) {
        var text = '';
        while (this.isAlpha(textToParse.charAt(this.currentPosition))) {
            text += textToParse.charAt(this.currentPosition);
            this.currentPosition++;
        }
        this.currentPosition--;
        return text;
    };

    /**
     * It returns the next chunk of the String, which represents the number. Non numeric characters end the text.
     * @private
     * @param textToParse {String} The text to use in parsing.
     * @return {Number} The full chunk of number
     */
    WKTTokens.prototype.readNumeric = function (textToParse) {
        var numeric = '';
        while (this.isNumeric(textToParse.charAt(this.currentPosition))) {
            numeric += textToParse.charAt(this.currentPosition);
            this.currentPosition++;
        }
        this.currentPosition--;
        return Number(numeric);
    };

    return WKTTokens;
});