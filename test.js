const utils = require("./lib/utils");
const _ = require("lodash");

const mail = {
    to: {value: _.map(["hs-leads+1@seasoned.pizza","to@seasoned.pizza","t.o@seasoned.pizza","to+12@seasoned.pizza","brushfire@seasoned.co"],(i)=>{ return {address: i}; })},
    cc: {value: _.map(["cc@seasoned.pizza","c.c@seasoned.pizza","cc+13@seasoned.pizza","brushfire+cc@seasoned.co","to@seasoned.pizza"],(i)=>{ return {address: i}; })}
}



const stringAddresses = utils.toStringAddresses(mail,"seasoned.pizza");

console.log("to", mail.to, "\n\n");
console.log("cc", mail.cc, "\n\n");
console.log("To String Addresses:",JSON.stringify(stringAddresses));