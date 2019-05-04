const Template = (function(){
    function Page(vars){
        return `<html>${Head(vars)}${Body(vars)}</html>`;
    }

    function Head(vars){
        return `<head></head>`;
    }

    function Body(vars){
        return `<body>${Content(vars)}</body>`;
    }

    function Content(vars){
        return vars.content.map(function(obj){
            if (typeof(obj) == "string"){
                return obj;
            } else {
                return "";
            }
        })
    }

    var Form = (function (vars){
        function inputField(field){
            if (field.type === "string"){

            } else if (field.type === "textArea"){

            } else if (field.type === "number"){

            } else if (field.type === "radio"){

            } else if (field.type === "checkbox"){

            } else if (field.type === "password"){

            }
        }

        return (function(vars){
            return `<form action=${vars.form.action}?next=${vars.form.next}>
                ${vars.form.fields.map => `<div class="form-row">
                    <label for="${field.name}_id">Email: </label><input id="${field.name}_id" name="${field.name}" />
                </div>`}
                <div class="submit-row">
                    <input type="submit" value="${field.submit ? field.submit: "Submit"}" />
                </div>
            </form>`
        })
    })();

    return Page;
})();

module.exports = Template