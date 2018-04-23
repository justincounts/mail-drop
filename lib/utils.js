const uuid = require("uuid/v4");
const moment = require("moment");
const _ = require("lodash");

module.exports ={
    getExpiry: () =>{ return 86400;},
    getMessageKey: (messageId)=>{ return `message:${messageId|| '<'+ uuid() + '@mx.seasoned.pizza>'}`},
    mapToNormalized: (inbox)=>{return _reduceToNormalized([],inbox)},
    getCanonicalInbox: (inbox)=>{return _getCanonicalInbox(inbox)},
    toStringAddresses: (mail, domain) =>{
        var array = _.concat( _parsedAddressValue(mail.to),_parsedAddressValue(mail.cc));
        console.log(array);
        var reduced =_(array).map((a)=> {
            var parts = a.address.split('@');
            return parts[1].toLowerCase() === domain.toLowerCase() ? parts[0]: undefined;
        }).reduce(_reduceToNormalized,[]);
        return _.uniq(reduced);
    },

    toSummary: (mail,key)=>{
        const preHeaderText = mail.text && mail.text.substr(0,140) ||"";

        return JSON.stringify({
            _id: key,
            from: mail.from,
            subject: mail.subject ||"(No Subject)",
            date: mail.date,
            messageId: mail.messageId,
            preHeader: preHeaderText,
            hasAttachment: !!(mail.attachments && mail.attachments.length)
        });
    }
};

const PLUS_AND_DOT = /\.|\+.*$/g;

function _getCanonicalInbox(inbox){
    return inbox.toLowerCase().replace(PLUS_AND_DOT, "");
}

function _reduceToNormalized(array,inbox){
    if(inbox) {
        array.push(inbox.toLowerCase());
        var normalized = _getCanonicalInbox(inbox);
        if (inbox !== normalized) {
            array.push(normalized);
        }
    }
    return array;
}

function _parsedAddressValue(obj){
    if(obj && obj.value){
        return obj.value;
    }
    return [];
}