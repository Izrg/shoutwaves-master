//SHOUT
// this is the id of the form
var isTagging;
var taggedName;
//window.isAnon =false;
window.onload = function() {
    //$.removeCookie('isAnon');
    var name_a= $('a#top_username');
    if (typeof $.cookie('isAnon') === "undefined") {
        $.cookie('isAnon', false, { expires: 7 });
    }
    if(($.cookie('isAnon')=== 'true')) {
        name_a.html('<i class="fa fa-user-secret fa-lg pad-3"></i> Anon');
    }
    else{
        name_a.html('<i class="fa fa-user fa-lg pad-3"></i> '+ $.cookie('username'));
    }
};

$('#anon_toggle').click(function() {
    var name_a= $('a#top_username');
    if(($.cookie('isAnon')=== 'true')) {
        name_a.html('<i class="fa fa-user fa-lg pad-3"></i> '+ $.cookie('username'));
        $.cookie('isAnon', false);
    }
    else{
        name_a.html('<i class="fa fa-user-secret fa-lg pad-3"></i> Anon');
        $.cookie('isAnon', true);
    }
});


$("#map-shout-form").submit(function() {
    var shout_modal= $('#shoutModal');
    var url = "shout"; // the script where you handle the form input.
    var form_data= $("#map-shout-form").serialize();

    //form_data.append('lng',JSON.stringify(shout_modal.attr('Lng')))
    //alert(shout_modal.attr('Lat')+shout_modal.attr('Lng'));
    var isAnon=$.cookie('isAnon');
    //alert(form_data+shout_modal.attr('latLng'));
    $.ajax({
        type: "POST",
        url: url,
        data: form_data+'&isAnon='+isAnon + '&lat=' + shout_modal.attr('Lat')+ '&lng='+shout_modal.attr('Lng'),
        //add loading
        success: function(data)
        {
            //add post to the top of wall
            $('#shoutModal').foundation('reveal', 'close');
        }
    });

    return false; // avoid to execute the actual submit of the form.
});


$(document).ready(function(){
    $("#cancelShoutButton").click(function() {
        $('#shoutModal').foundation('reveal', 'close');
        //alert("hi!");

    });
});

$("#shout_area").on("click", ".show_comment",function() {
    var shout_id =$(this).attr("data-shout-key");
    showCommentsCall(shout_id);
    var content= 'content_comment_' + shout_id;
    var sign= 'expanderSign_comment_' + shout_id;
    $('#'+content).slideToggle();
    if ($("#"+ sign).text() == "+"){
        //showComments($(this).attr('post_Id'))
        $("#"+ sign).html("−")
    }
    else {
        $("#"+ sign).text("+")
    }
});


$(document).ready(function(){
    $(function() {
        $('.animated-comment-area').autosize();
    });

});

//ajax show comment methods
function showCommentsCall(shout_id){
    //window.alert("show commentzzzz_ "+shout_key);
    $.ajax('/shout/comments/',{
        type: 'GET',
        data:{
            dataType: "json",
            shout_id: shout_id
        },
        success: function(data){
            $('#content_comment_'+shout_id).html(data);
        },
        error: function( req, status, err ) {
            console.log( 'something went wrong', status, err );
        }
    });
}

//making comment ajax call
function handlePostComment(post_Id){
    //window.alert("commentess"+post_Id);
    var content= $("#commentTextArea_"+post_Id).val();
    $.ajax('/comment/',{
        type: 'POST',
        data:{
            post_id: post_Id,
            comment_content: content
        }
    });
};
//END OF COMMENTS

$(document).ready(function(){
    $('.page-button').mouseenter(function () {
        $(this).css('box-shadow', '0px 1px 2px #888').animate({
            borderWidth: 0
        }, 100);
    }).mouseleave(function () {
        $(this).animate({
            borderWidth: 0
        }, 100);
    });
});

function remCalc(sizePx){
    return sizePx/16;
};

$(window).on('resize', function(){
    var shout_area =$('#shout_area');
    var wh_map = $(window).height()-45;
    //constantly change size if re-sized
    shout_area.css("height", wh_map+"px")
    if(remCalc($(window).width())> 35.31){
        shout_area.css("width", "35.31rem")
    }

});

//TAGGING START
//Function called when the user wants to tag someone.
function shoutTag(e){
    var keynum;
    if(isTagging){
        //alert('You are tagging!');

        //Checks to see if the user hits the space, which disabels tagging.
        if(window.event){ // IE
            keynum = e.keyCode;
        }else
        if(e.which){ // Netscape/Firefox/Opera
            keynum = e.which;
        }
        if (String.fromCharCode(keynum) == " "){
            isTagging = false;
            //alert("No longer tagging!");
            return;
        }else{
            taggedName = taggedName + String.fromCharCode(keynum);
            getTagging(taggedName);
            //alert(taggedName);
        }
    }

    if(window.event){ // IE
        keynum = e.keyCode;
    }else
    if(e.which){ // Netscape/Firefox/Opera
        keynum = e.which;
    }
    if (String.fromCharCode(keynum) == "@"){
        isTagging = true;
        taggedName = "";
    }
}
//Ajax function for getting names from backend
function getTagging(names){
    //alert("Looking for user " + names);
    $.ajax('/user/',{
        type: 'GET',
        data: {
            dataType: 'json',
            username: names
        },
        success: function(responseText){
            console.log(responseText);
            showTags(responseText)
        },
        error: function(req, status, err){
            console.log( 'something went wrong', status, err );
            isTagging = false;
        }

    });
}

function showTags(users){
    var tag_div = $('#tagging');
    c_html = '';

    $.each(users, function(i, users){
        var firstname = users.first_name;
        var lastname = users.last_name;
        //var userID = users.ID;

        console.log("First name: " + firstname + " lastname: " + lastname);

        tagging_html = '<div>' +
        firstname +
        ' ' +
        lastname+
        //'<a href="#" class="close">&times;</a>'
        '</div>';
        c_html += tagging_html;
    });

    tag_div.html(c_html)
}



