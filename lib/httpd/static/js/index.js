
Vue.config.devtools = true;

$(document).ready(function () {

    var inboxVue = new Vue({
        el: '#mail-app',
        name:"MailDrop",
        data: {
            selectedInbox:"",
            selectedMessage: undefined,
            inboxSearchActive: false,
            deleteInboxActive: false,
            deleteMessageActive: false,
            inboxSearchTerm: undefined,
            inboxes: [],
            subInboxes: [],
            superInboxes: [],
            messages:{},
            summaries: [],
            summaryTotal: 0,
            isLoading: false,
            inboxTimer: undefined,
            toast: {class: "", text:"", visible: false, duration: 3000}
        },
        beforeCreate: function(){
            searchInboxes(undefined,this);
        },
        computed:{

        },
        methods: {
            inboxDisplayName: inboxDisplayName,
            showMessage: loadMessage,
            toggleInboxSearchOpen: function(){ this.inboxSearchActive = !this.inboxSearchActive;},
            toggleDeleteInboxOpen: function(){ this.deleteInboxActive = !this.deleteInboxActive;},
            toggleDeleteMessageOpen: function(){ this. deleteMessageActive = !this. deleteMessageActive;},
            showInbox: function(i){alert(this.selectedInbox);this.selectedInbox = i},
            deleteMessage: deleteMessage,
            deleteInbox: deleteInbox,
        },
    });

    inboxVue.$watch('selectedInbox', loadInbox);

    inboxVue.$watch('inboxSearchTerm',_.debounce(function(newVal){
        searchInboxes(newVal,inboxVue)
    },500, { 'trailing': true, 'leading': false }));


    function searchInboxes(term,vue){
        window.fetch(`/api/inboxes?term=${term ? encodeURIComponent(term):''}`)
            .then(function(response){
                return(response.json());
            }).then(function(json){
              vue.$data.inboxes = json['inboxes'];
        });
    }

    function loadInbox(inbox){
        if(inbox) {
            const displayName = inboxDisplayName(inbox);
            inboxVue.$data.inboxes = [];
            inboxVue.$data.inboxSearchActive = false;
            inboxVue.$data.isLoading = true;
            inboxVue.$data.inboxTimer && window.clearTimeout(inboxVue.$data.inboxTimer);
            return window.fetch(`/api/inbox?name=${encodeURIComponent(inbox)}`)
                .then(function (response) {
                    return (response.json());
                }).then(function (json) {
                    inboxVue.$data.summaries = json['summaries'];
                    inboxVue.$data.superInboxes = json['superInboxes'];
                    inboxVue.$data.subInboxes = json['subInboxes'];
                    inboxVue.$data.summaryTotal = json['total'];
                    inboxVue.$data.inboxSearchTerm = inbox.substr(6);
                    inboxVue.$data.isLoading = false;
                    inboxVue.$data.inboxTimer = window.setTimeout(() => {
                        loadInbox(inbox)
                    }, 15000);
                });
        } else {
            inboxVue.$data.inboxSearchActive = false;
            inboxVue.$data.isLoading = false;
            inboxVue.$data.inboxTimer && window.clearTimeout(inboxVue.$data.inboxTimer);
            inboxVue.$data.summaries = [];
            inboxVue.$data.superInboxes = [];
            inboxVue.$data.subInboxes = [];
            inboxVue.$data.summaryTotal = 0;
            inboxVue.$data.inboxSearchTerm = "";
            inboxVue.$data.isLoading = false;
        }
    }

    function loadMessage(msgId) {
        const promise = new Promise(function(resolve,reject){
            if(inboxVue.$data.messages[msgId]){
               return resolve(inboxVue.$data.messages[msgId])
            } else {
                window.fetch(`/api/message?id=${msgId}`)
                    .then(function(response){
                        return(response.json());
                    }).then(function(json){
                    inboxVue.$data.messages[msgId]= json;
                    return resolve(json)
                });
            }
        }).then(function(msg){
            inboxVue.$data.selectedMessage = msg;
            $(".summary-card").removeClass("is-active")
                .filter("[data-message-id='"+msg.messageId+"']")
                .addClass('is-active');
        });
    }

    function deleteMessage(msgId){
        window.fetch(`/api/delete/message?id=message:${msgId}`)
            .then(function(response){
                return(response.json());
            }).then(function(json){
                delete inboxVue.$data.messages[`message:${msgId}`];
                inboxVue.$data.selectedMessage =null;
                inboxVue.$data.deleteMessageActive = false;
                loadInbox(inboxVue.$data.selectedInbox).then(function(){
                    showToast({text: json.text, class: json.class, duration: 5000});
                });
        });
    }

    function deleteInbox(inbox){
        window.fetch(`/api/delete/inbox?name=${inbox}`)
            .then(function(response){
                return(response.json());
            }).then(function(json){
            inboxVue.$data.messages=[];
            inboxVue.$data.selectedMessage =null;
            inboxVue.$data.selectedInbox =null;
            inboxVue.$data.deleteInboxActive = false;
            showToast({text: json.text, class: json.class, duration: 5000});
        });
    }

    function inboxDisplayName(inbox){ return inbox ? `${inbox.substr(6)}@seasoned.pizza`:'';}

    function showToast(toast){
        var duration = toast.duration || 3000;
        toast.visible = true;
        inboxVue.$data.toast = toast;
        setTimeout(function(){
            inboxVue.$data.toast.visible = false;
        },duration)
    }

});