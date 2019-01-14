Lawccess.users = {}

$.post(Lawccess.context.ajaxURL+"get_current_members/"+Lawccess.context.project,{"model":"project","project":Lawccess.context.project}, function(response){
    Lawccess.users=response;
})
