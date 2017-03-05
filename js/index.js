/**
 * Created by dsar941 on 9/8/2016.
 * TODO: OPTIMIZE CODE
 * TODO: OPTIMIZE CODE
 * TODO: OPTIMIZE CODE
 */

(function (global) {
    'use strict';

    var endpoint = "https://models.physiomeproject.org/pmr2_virtuoso_search";

    var annotationHtml = "snippets/annotation.html";
    var epithelialHtml = "snippets/epithelial.html";
    var modelHtml = "snippets/model.html";
    var searchHtml = "snippets/search.html";
    var viewHtml = "snippets/view.html";

    // Set up a namespace for our utility
    var mainUtils = {};

    mainUtils.fromEpithelialToModelState = 0;

    // Track models for delete operation
    mainUtils.listOfModels = [];

    // Pre-process models before list of models
    // selection for delete operation
    mainUtils.templistOfModel = [];

    // Add models in the loadModelHtml
    mainUtils.model = [];
    mainUtils.model2DArr = [];

    // Initial declarations for a table
    var table = document.createElement("table");
    table.className = "table";

    // Convenience function for inserting innerHTML for 'select'
    var insertHtml = function (selector, html) {
        var targetElem = document.querySelector(selector);
        targetElem.innerHTML = html;
    };

    // Show loading icon inside element identified by 'selector'.
    var showLoading = function (selector) {
        var html = "<div class='text-center'>";
        html += "<img src='images/ajax-loader.gif'></div>";
        insertHtml(selector, html);
    };

    // Return substitute of '{{propName}}'
    // with propValue in given 'string'
    var insertProperty = function (string, propName, propValue) {
        var propToReplace = "{{" + propName + "}}";
        string = string.replace(new RegExp(propToReplace, "g"), propValue);
        return string;
    };

    // Find the current active menu button
    var findActiveItem = function () {
        var classes = document.querySelector("#ulistItems");
        for (var i = 0; i < classes.getElementsByTagName("li").length; i++) {
            if (classes.getElementsByTagName("li")[i].className === "active")
                return classes.getElementsByTagName("li")[i].id;
        }
    };

    // Remove the class 'active' from source to target button
    var switchListItemToActive = function (source, target) {
        // Remove 'active' from source button
        var classes = document.querySelector(source).className;
        classes = classes.replace(new RegExp("active", "g"), "");
        document.querySelector(source).className = classes;

        // Add 'active' to target button if not already there
        classes = document.querySelector(target).className;
        if (classes.indexOf("active") === -1) {
            classes += "active";
            document.querySelector(target).className = classes;
        }
    };

    mainUtils.loadHomeHtml = function () {
        // Switch from current active button to home button
        var activeItem = "#" + findActiveItem();
        switchListItemToActive(activeItem, "#listHome");

        insertHtml("#main-content", "... Coming soon");
    };

    mainUtils.loadHelp = function () {
        // Switch from current active button to home button
        var activeItem = "#" + findActiveItem();
        switchListItemToActive(activeItem, "#help");

        insertHtml("#main-content", "...Coming soon");
    };

    // On page load (before images or CSS)
    document.addEventListener("DOMContentLoaded", function (event) {
        // Place some startup code here
    });

    // Load the annotation view
    mainUtils.loadAnnotationHtml = function () {
        // Switch from current active button to annotation button
        var activeItem = "#" + findActiveItem();
        switchListItemToActive(activeItem, "#listAnnotation");

        var query = 'SELECT ?id WHERE { ?id  <http://biomodels.net/biology-qualifiers/isVersionOf> ' +
            '<http://identifiers.org/go/GO:0005272> }';

        showLoading("#main-content");

        $ajaxUtils.sendPostRequest(
            endpoint,
            query,
            function (jsonObj) {
                $ajaxUtils.sendGetRequest(
                    annotationHtml,
                    function (annotationHtmlContent) {
                        var annotationHtmlViewToIndexHtml = mainUtils.showWorkspace(jsonObj, annotationHtmlContent);
                        insertHtml("#main-content", annotationHtmlViewToIndexHtml);
                    },
                    false);
            },
            true);
    };

    // TODO: make use of accordion
    // Show workspaces in the annotation html
    mainUtils.showWorkspace = function (jsonObj, annotationHtmlContent) {

        var label = [];
        var finalHtml = annotationHtmlContent;

        var html = "<section class='row'>";

        for (var i = 0; i < jsonObj.results.bindings.length; i++) {

            // id with workspace name as a string
            var idWithStr = jsonObj.results.bindings[i].id.value;
            var index = idWithStr.search(".cellml");
            var workspaceName = idWithStr.slice(0, index);

            var workspaceUrl = "https://models.physiomeproject.org/workspace" + "/" + workspaceName + "/" + "@@file" +
                "/" + "HEAD" + "/" + jsonObj.results.bindings[i].id.value;

            label[i] = document.createElement("label");
            label[i].id = idWithStr;
            label[i].innerHTML = '<input id="' + label[i].id + '" type="checkbox" data-action="annotation" value="" ' +
                'class="checkbox"> ';

            label[i].innerHTML += '<a href=' + workspaceUrl + ' + target=_blank>' + workspaceName + " / " + idWithStr +
                '</a></label>';

            html += '<label>' + label[i].innerHTML + '</label><br>';
        }

        html += "</section>";

        finalHtml = insertProperty(finalHtml, "description", html);

        return finalHtml;
    };

    // Even handling for ANNOTATION, SEARCH, MODEL
    var actions = {
        annotation: function (event) {

            console.log("annotation event: ", event);

            if (event.srcElement.className == "checkbox" && event.srcElement.checked == true) {
                var idWithStr = event.srcElement.id;
                var n = idWithStr.search("#");
                var id = idWithStr.slice(n + 1, idWithStr.length);

                // id
                var index = idWithStr.search(".cellml");
                var workspaceName = idWithStr.slice(0, index);

                mainUtils.workspaceName = workspaceName;

                var vEndPoint = "https://models.physiomeproject.org/workspace" + "/" + workspaceName + "/" + "rawfile" +
                    "/" + "HEAD" + "/" + idWithStr;

                // Get variable name for a particular CellML Id
                mainUtils.showVariableName = function (str) {
                    var parser = new DOMParser();
                    var xmlDoc = parser.parseFromString(str, "text/xml");

                    var vHtml = event.srcElement.parentElement;

                    // Look up by variable tag
                    for (var i = 0; i < xmlDoc.getElementsByTagName("variable").length; i++) {
                        if (xmlDoc.getElementsByTagName("variable")[i].getAttribute("cmeta:id") == id) {
                            vHtml.innerHTML += '<hr>';
                            vHtml.innerHTML += id + '<br>';
                            vHtml.innerHTML += xmlDoc.getElementsByTagName("variable")[i].getAttribute("name") + '<br>';
                            vHtml.innerHTML += '<hr>';
                        }
                    }
                };

                $ajaxUtils.sendGetRequest(vEndPoint, mainUtils.showVariableName, false);
            }
        },

        search: function (event) {

            console.log("search event: ", event);

            if (event.srcElement.className == "checkbox") {

                if (event.srcElement.checked) {
                    var idWithStr = event.srcElement.id;
                    var index = idWithStr.search("#");
                    var workspaceName = idWithStr.slice(0, index);

                    mainUtils.workspaceName = workspaceName;
                }
                else {
                    mainUtils.workspaceName = "";
                }
            }
        },

        model: function (event) {

            console.log("model event: ", event);

            // select one by one
            if (event.srcElement.className == "attribute") {

                if (event.srcElement.checked) {
                    mainUtils.templistOfModel.push(event.srcElement.value);
                }
                else {
                    var pos = mainUtils.templistOfModel.indexOf(event.srcElement.value);
                    mainUtils.templistOfModel.splice(pos, 1);
                }

                var idWithStr = event.srcElement.id;
                var index = idWithStr.search("#");
                var workspaceName = idWithStr.slice(0, index);

                // mainUtils.workspaceName.push(workspaceName);
                mainUtils.workspaceName = workspaceName;
            }

            // select all
            if (event.srcElement.className == "attributeAll") {

                if (event.srcElement.checked == true) {
                    for (var i = 0; i < $('.attribute').length; i++) {
                        $('.attribute')[i].checked = true;

                        mainUtils.templistOfModel.push($('.attribute')[i].value);
                    }
                }
                else {
                    for (var i = 0; i < $('.attribute').length; i++) {
                        $('.attribute')[i].checked = false;

                        var pos = mainUtils.templistOfModel.indexOf($('.attribute')[i].value);
                        mainUtils.templistOfModel.splice(pos, 1);
                    }
                }
            }
        }
    };

    // Even invocation to ANNOTATION, SEARCH, MODEL
    document.addEventListener('click', function (event) {
        // If there's an action with the given name, call it
        if (typeof actions[event.srcElement.dataset.action] === "function") {
            actions[event.srcElement.dataset.action].call(this, event);
        }
    })

    // Load search html
    mainUtils.loadSearchHtml = function () {

        // state reinitialize when redirect from epithelial
        mainUtils.fromEpithelialToModelState = 0;

        if (!sessionStorage.getItem("searchListContent")) {
            $ajaxUtils.sendGetRequest(
                searchHtml,
                function (searchHtmlContent) {
                    insertHtml("#main-content", searchHtmlContent);
                },
                false);

        }
        else {
            insertHtml("#main-content", sessionStorage.getItem('searchListContent'));
        }

        // Switch from current active button to discovery button
        var activeItem = "#" + findActiveItem();
        switchListItemToActive(activeItem, "#listDiscovery");
    };

    // TODO: make a common table platform for all functions
    // Show semantic annotation extracted from PMR
    mainUtils.searchList = function (head, modelEntity, biologicalMeaning, speciesList, geneList, proteinList) {

        var searchList = document.getElementById("searchList");

        // Search result does not match
        if (head.length == 0) {
            searchList.innerHTML = "<section class='container-fluid'><label><br>No Search Results!</label></section>";
            return;
        }

        // Make empty space for a new search
        searchList.innerHTML = "";

        var table = document.createElement("table");
        table.className = "table";

        // Table header
        var thead = document.createElement("thead");
        var tr = document.createElement("tr");
        for (var i = 0; i < head.length; i++) {
            // Empty header for checkbox column
            if (i == 0) {
                var th = document.createElement("th");
                th.appendChild(document.createTextNode(""));
                tr.appendChild(th);
            }

            var th = document.createElement("th");
            th.appendChild(document.createTextNode(head[i]));
            tr.appendChild(th);
        }

        thead.appendChild(tr);
        table.appendChild(thead);

        // Table body
        var tbody = document.createElement("tbody");
        for (var i = 0; i < modelEntity.length; i++) {
            var tr = document.createElement("tr");

            var temp = [];
            var td = [];
            temp.push(modelEntity[i], biologicalMeaning[i], speciesList[i], geneList[i], proteinList[i]);

            for (var j = 0; j < temp.length; j++) {
                if (j == 0) {
                    td[j] = document.createElement("td");
                    var label = document.createElement('label');
                    label.innerHTML = '<input id="' + modelEntity[i] + '" type="checkbox" data-action="search" value="' +
                        modelEntity[i] + '" class="checkbox"></label>';

                    td[j].appendChild(label);
                    tr.appendChild(td[j]);
                }

                td[j] = document.createElement("td");
                td[j].appendChild(document.createTextNode(temp[j]));
                tr.appendChild(td[j]);
            }

            tbody.appendChild(tr);
        }

        table.appendChild(tbody);
        searchList.appendChild(table);

        // Fill in the search attribute value
        var searchTxt = document.getElementById("searchTxt");
        searchTxt.setAttribute('value', sessionStorage.getItem('searchTxtContent'));

        // SET main content in the local storage
        var maincontent = document.getElementById('main-content');
        sessionStorage.setItem('searchListContent', $(maincontent).html());
    }

    // Utility function to extract a model name
    var parseModel = function (modelEntity) {
        var indexOfCellML = modelEntity.search(".cellml");
        var indexOfHash = modelEntity.search("#");
        var modelName = modelEntity.slice(0, indexOfCellML);
        var modelNameWithExt = modelEntity.slice(0, indexOfHash + 1);
        var model = modelNameWithExt.concat(modelName);

        return model;
    }

    // Table headers in search table
    var headTitle = function (jsonModel, jsonSpecies, jsonGene, jsonProtein) {
        var head = [];

        for (var i = 0; i < jsonModel.head.vars.length; i++)
            head.push(jsonModel.head.vars[i]);

        head.push(jsonSpecies.head.vars[0]);
        head.push(jsonGene.head.vars[0]);
        head.push(jsonProtein.head.vars[0]);

        return head;
    }

    // TODO: make it more efficient, use less variables
    // Plain text search for semantic annotation
    document.addEventListener('keydown', function (event) {
        if (event.key == 'Enter') {

            var searchTxt = document.getElementById("searchTxt").value;

            // TODO: avoid using regex inside SPARQL!!
            // TODO: could use PMR services (PMR text search, RICORDO, etc)
            var re = /^.*$/g;

            var searchstr = searchTxt.match(re).toString()
                .replace(/\s+/g, " ", "i")
                .replace(/\s*\/\s*/g, '/', "i")
                .replace(/\s*\-\s*/g, '-', "i");

            // set local storage
            sessionStorage.setItem('searchTxtContent', searchTxt);

            var query = 'SELECT ?Model_entity ?Biological_meaning WHERE ' +
                '{ GRAPH ?Workspace { ?Model_entity ?Location ?Biological_meaning . ' +
                'FILTER regex(str(?Biological_meaning), "' + searchstr + '", "i") . ' +
                '}}';

            showLoading("#searchList");

            // Index to get model name for species, genes, and breaking condition
            var idxSpecies = 0, idxGene = 0, idxBreak = 0;
            var modelEntity = [], biologicalMeaning = [];
            var speciesList = [], geneList = [], proteinList = [];
            var head = [];

            // Model
            $ajaxUtils.sendPostRequest(
                endpoint,
                query,
                function (jsonModel) {
                    console.log(jsonModel);
                    for (var id = 0; id < jsonModel.results.bindings.length; id++) {
                        modelEntity.push(jsonModel.results.bindings[id].Model_entity.value);
                        biologicalMeaning.push(jsonModel.results.bindings[id].Biological_meaning.value);

                        var model = parseModel(jsonModel.results.bindings[id].Model_entity.value);
                        var query = 'SELECT ?Species WHERE { <' + model + '> <http://purl.org/dc/terms/Species> ?Species }';

                        // Species
                        $ajaxUtils.sendPostRequest(
                            endpoint,
                            query,
                            function (jsonSpecies) {
                                if (jsonSpecies.results.bindings.length == 0)
                                    speciesList.push("Undefined");
                                else
                                    speciesList.push(jsonSpecies.results.bindings[0].Species.value);

                                model = parseModel(jsonModel.results.bindings[idxSpecies++].Model_entity.value);

                                var query = 'SELECT ?Gene WHERE { <' + model + '> <http://purl.org/dc/terms/Gene> ?Gene }';

                                // Gene
                                $ajaxUtils.sendPostRequest(
                                    endpoint,
                                    query,
                                    function (jsonGene) {
                                        if (jsonGene.results.bindings.length == 0)
                                            geneList.push("Undefined");
                                        else
                                            geneList.push(jsonGene.results.bindings[0].Gene.value);

                                        model = parseModel(jsonModel.results.bindings[idxGene++].Model_entity.value);

                                        var query = 'SELECT ?Protein WHERE ' +
                                            '{ <' + model + '> <http://purl.org/dc/terms/Protein> ?Protein }';

                                        // Protein
                                        $ajaxUtils.sendPostRequest(
                                            endpoint,
                                            query,
                                            function (jsonProtein) {
                                                if (jsonProtein.results.bindings.length == 0)
                                                    proteinList.push("Undefined");
                                                else
                                                    proteinList.push(jsonProtein.results.bindings[0].Protein.value);

                                                idxBreak++;

                                                if (idxBreak == jsonModel.results.bindings.length) {
                                                    head = headTitle(jsonModel, jsonSpecies, jsonGene, jsonProtein);

                                                    mainUtils.searchList(
                                                        head,
                                                        modelEntity,
                                                        biologicalMeaning,
                                                        speciesList,
                                                        geneList,
                                                        proteinList);
                                                }
                                            },
                                            true);
                                    },
                                    true);
                            },
                            true);
                    }

                    // No search results found, so sent empty arrays
                    if (!jsonModel.results.bindings.length) {
                        mainUtils.searchList(head, modelEntity, biologicalMeaning, speciesList, geneList, proteinList);
                    }
                },
                true
            );
        }
    });

    // Load the view
    mainUtils.loadViewHtml = function () {
        var cellmlModel = mainUtils.workspaceName;

        var indexOfCellML = cellmlModel.search(".cellml");
        var modelName = "#" + cellmlModel.slice(0, indexOfCellML);
        var subject = cellmlModel.concat(modelName);

        var query = 'SELECT ?Workspace ?Title ?Author ?Abstract ?Keyword ?Protein ?Species ?Gene ?Compartment ?Located_in ?DOI ' +
            'WHERE { GRAPH ?Workspace { ' +
            '<' + subject + '> <http://purl.org/dc/terms/title> ?Title . ' +
            'OPTIONAL { <' + subject + '> <http://www.w3.org/2001/vcard-rdf/3.0#FN> ?Author } . ' +
            'OPTIONAL { <' + subject + '> <http://purl.org/dc/terms/Abstract> ?Abstract } . ' +
            'OPTIONAL { <' + subject + '> <http://purl.org/dc/terms/Keyword> ?Keyword } . ' +
            'OPTIONAL { <' + subject + '> <http://purl.org/dc/terms/Protein> ?Protein } . ' +
            'OPTIONAL { <' + subject + '> <http://purl.org/dc/terms/Species> ?Species } . ' +
            'OPTIONAL { <' + subject + '> <http://purl.org/dc/terms/Gene> ?Gene } . ' +
            'OPTIONAL { <' + subject + '> <http://purl.org/dc/terms/Compartment> ?Compartment } . ' +
            'OPTIONAL { <' + subject + '> <http://www.obofoundry.org/ro/ro.owl#located_in> ?Located_in } . ' +
            'OPTIONAL { <' + subject + '> <http://biomodels.net/model-qualifiers/isDescribedBy> ?DOI } . ' +
            '}}';

        showLoading("#main-content");
        $ajaxUtils.sendPostRequest(
            endpoint,
            query,
            function (jsonObj) {
                $ajaxUtils.sendGetRequest(
                    viewHtml,
                    function (viewHtmlContent) {
                        insertHtml("#main-content", viewHtmlContent);
                        $ajaxUtils.sendPostRequest(endpoint, query, mainUtils.showView, true);
                    },
                    false);
            },
            true);
    };

    // Create anchor tag
    var createAnchor = function (value) {
        var aText = document.createElement('a');
        aText.setAttribute('href', value);
        aText.setAttribute('target', "_blank");
        aText.innerHTML = value;
        return aText;
    };

    // Find duplicate items
    var searchFn = function (searchItem, arrayOfItems) {
        var counter = 0;
        for (var i = 0; i < arrayOfItems.length; i++) {
            if (arrayOfItems[i] == searchItem)
                counter++;
        }

        return counter;
    };

    // Show a selected entry from the search results
    mainUtils.showView = function (jsonObj, viewHtmlContent) {
        var viewList = document.getElementById("viewList");

        for (var i = 0; i < jsonObj.head.vars.length; i++) {
            var divHead = document.createElement("div");
            divHead.className = "h2";

            var divText = document.createElement("div");
            divText.className = "p";

            divHead.appendChild(document.createTextNode(jsonObj.head.vars[i]));
            divHead.appendChild(document.createElement("hr"));
            viewList.appendChild(divHead);

            var tempArrayOfURL = [];
            var tempArray = [];

            // IF more than one result in the JSON object
            for (var j = 0; j < jsonObj.results.bindings.length; j++) {
                var tempValue = jsonObj.results.bindings[j][jsonObj.head.vars[i]].value;

                // TODO: regular expression to validate a valid URL
                if (tempValue.indexOf("http") != -1) {
                    var aText = createAnchor(tempValue);
                    tempArrayOfURL.push(tempValue);
                    if (searchFn(tempValue, tempArrayOfURL) <= 1)
                        divText.appendChild(aText);
                }
                else {
                    tempArray.push(tempValue);
                    if (searchFn(tempValue, tempArray) <= 1)
                        divText.appendChild(document.createTextNode(tempValue));
                }

                viewList.appendChild(divText);

                var divText = document.createElement("div");
                divText.className = "p";
            }
        }
    };

    // Load the model
    mainUtils.loadModelHtml = function () {

        var cellmlModel = mainUtils.workspaceName;

        var indexOfCellML = cellmlModel.search(".cellml");
        var modelName = "#" + cellmlModel.slice(0, indexOfCellML);
        var subject = cellmlModel.concat(modelName); // e.g. weinstein_1995.cellml#weinstein_1995

        var query = 'SELECT ?Model_entity ?Protein ?Species ?Gene ?Compartment ' +
            'WHERE { GRAPH ?Workspace { ' +
            'OPTIONAL { ?Model_entity <http://purl.org/dc/terms/Protein> ?Protein } . ' +
            'OPTIONAL { ?Model_entity <http://purl.org/dc/terms/Species> ?Species } . ' +
            'OPTIONAL { ?Model_entity <http://purl.org/dc/terms/Gene> ?Gene } . ' +
            'OPTIONAL { ?Model_entity <http://purl.org/dc/terms/Compartment> ?Compartment } . ' +
            'FILTER (?Model_entity = <' + subject + '>) . ' +
            '}}';

        // showLoading("#main-content");
        // if (!sessionStorage.getItem("loadmodelcontent")) {
        $ajaxUtils.sendGetRequest(
            modelHtml,
            function (modelHtmlContent) {
                insertHtml("#main-content", modelHtmlContent);

                if (mainUtils.fromEpithelialToModelState == 0) {
                    $ajaxUtils.sendPostRequest(endpoint, query, mainUtils.showModel, true);
                } else {
                    // state reinitialize, load epithelial to load model
                    mainUtils.fromEpithelialToModelState = 0;
                    insertHtml("#main-content", sessionStorage.getItem('loadmodelcontent'));
                }
            },
            false);
    };

    // Show selected items in a table
    mainUtils.showModel = function (jsonObj) {

        console.log("showModel: ", jsonObj);

        var modelList = document.getElementById("modelList");

        var table = document.createElement("table");
        table.className = "table";

        // Table header
        var thead = document.createElement("thead");
        var tr = document.createElement("tr");
        for (var i = 0; i < jsonObj.head.vars.length; i++) {
            if (i == 0) {
                var th = document.createElement("th");
                mainUtils.headId = jsonObj.head.vars[0];
                tr.id = mainUtils.headId;
                var label = document.createElement('label');
                label.innerHTML = '<input id="' + mainUtils.headId + '" type="checkbox" name="attributeAll" class="attributeAll" ' +
                    'data-action="model" value="' + mainUtils.headId + '" ></label>';

                th.appendChild(label);
                tr.appendChild(th);
            }

            var th = document.createElement("th");
            th.appendChild(document.createTextNode(jsonObj.head.vars[i]));
            tr.appendChild(th);
        }

        thead.appendChild(tr);
        table.appendChild(thead);

        // Table body
        for (var i = 0; i < jsonObj.head.vars.length; i++) {
            if (i == 0) {
                // search list to model list with empty model
                if (jsonObj.results.bindings.length == 0) break;

                var id = jsonObj.results.bindings[i].Model_entity.value;
                var label = document.createElement('label');
                label.innerHTML = '<input id="' + id + '" type="checkbox" name="attribute" class="attribute" ' +
                    'data-action="model" value="' + id + '" ></label>';

                mainUtils.model.push(label);
            }

            if (jsonObj.head.vars[i] == "Compartment") {
                var compartment = "";
                for (var c = 0; c < jsonObj.results.bindings.length; c++) {
                    if (c == 0)
                        compartment += jsonObj.results.bindings[c][jsonObj.head.vars[i]].value;
                    else
                        compartment += "," + jsonObj.results.bindings[c][jsonObj.head.vars[i]].value;
                }

                mainUtils.model.push(compartment);
            }
            else {
                mainUtils.model.push(jsonObj.results.bindings[0][jsonObj.head.vars[i]].value);
            }
        }

        // 1D to 2D array
        while (mainUtils.model.length) {
            mainUtils.model2DArr.push(mainUtils.model.splice(0, 6)); // 5 + 1 (checkbox) header elemenet
        }

        var td = [];
        var tbody = document.createElement("tbody");
        for (var ix = 0; ix < mainUtils.model2DArr.length; ix++) {
            var tr = document.createElement("tr");
            // +1 for adding checkbox column
            for (var j = 0; j < jsonObj.head.vars.length + 1; j++) {
                td[j] = document.createElement("td");
                if (j == 0)
                    td[j].appendChild(mainUtils.model2DArr[ix][j]);
                else
                    td[j].appendChild(document.createTextNode(mainUtils.model2DArr[ix][j]));

                // Id for each row
                if (j == 1)
                    tr.setAttribute("id", mainUtils.model2DArr[ix][j]);

                tr.appendChild(td[j]);
            }

            tbody.appendChild(tr);
        }

        table.appendChild(tbody);
        modelList.appendChild(table);

        // Un-check checkbox in the model page
        // load epithelial to model discovery to load model
        for (var i = 0; i < $('table tr td label').length; i++) {
            if ($('table tr td label')[i].firstChild.checked == true) {
                $('table tr td label')[i].firstChild.checked = false;
            }
        }

        // SET main content in the local storage
        var loadmodelcontent = document.getElementById('main-content');
        sessionStorage.setItem('loadmodelcontent', $(loadmodelcontent).html());
    };

    mainUtils.deleteRowModelHtml = function () {

        // Un-check header checkbox if body is empty
        if ($('table tr th label')[0].firstChild.checked == true) {
            $('table tr th label')[0].firstChild.checked = false;
        }

        // Model_entity with same name will be removed
        // regardless of the current instance of checkboxes
        mainUtils.templistOfModel.forEach(function (element) {
            for (var i = 0; i < $('table tr').length; i++) {

                if ($('table tr')[i].id == element) {
                    // Remove selected row
                    $('table tr')[i].remove();

                    console.log("deleteRowModelHtml INSIDE: ", mainUtils.templistOfModel);

                    // Remove from mainUtils.model2DArr
                    mainUtils.model2DArr.forEach(function (elem, index) {
                        if (element == elem[1]) {
                            mainUtils.model2DArr.splice(index, 1);
                        }
                    })
                }
            }
        });

        console.log("deleteRowModelHtml INSIDE model2DArr: ", mainUtils.model2DArr);

        // Empty temp model list
        mainUtils.templistOfModel = [];

        // TODO: click when empty loadmodel table!! Fix this!!
    };

    mainUtils.loadEpithelialHtml = function () {

        mainUtils.fromEpithelialToModelState = 1; // state initialize to 1

        $ajaxUtils.sendGetRequest(
            epithelialHtml,
            function (epithelialHtmlContent) {
                insertHtml("#main-content", epithelialHtmlContent);

                $ajaxUtils.sendGetRequest(epithelialHtml, mainUtils.showEpithelial, false);
            },
            false);
    }

    mainUtils.showEpithelial = function (epithelialHtmlContent) {

        var g = document.getElementById("#svgVisualize"),
            w = 700,
            h = 700,
            width = 300,
            height = 400;

        var svg = d3.select("#svgVisualize").append("svg")
            .attr("width", w)
            .attr("height", h);

        // TODO: extend this with lines and circles
        var newgdefs = svg.append("g");
        newgdefs.append("defs")
            .append("pattern")
            .attr("id", "basicPattern")
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", 4)
            .attr("height", 4)
            .append("circle")
            .attr("cx", "0")
            .attr("cy", "0")
            .attr("r", "1.5")
            // .append("line")
            // .attr("x1", "0")
            // .attr("y1", "0")
            // .attr("x2", "4")
            // .attr("y2", "0")
            .attr("stroke", "#6495ED")
            .attr("stroke-width", 1.5);

        // Rectangle
        var newg = svg.append("g").data([{x: 100, y: 10}]);

        var dragrect = newg.append("rect")
            .attr("id", "rectangle")
            .attr("x", function (d) {
                return d.x;
            })
            .attr("y", function (d) {
                return d.y;
            })
            .attr("width", width)
            .attr("height", height)
            .attr("rx", 10)
            .attr("ry", 20)
            .attr("fill", "white")
            .attr("stroke", "url(#basicPattern)")
            .attr("stroke-width", 20)
            .attr("cursor", "move")
            .call(d3.drag()
                .on("drag", dragmove));

        var dragleft = newg.append("rect")
            .attr("x", function (d) {
                return d.x;
            })
            .attr("y", function (d) {
                return d.y;
            })
            .attr("height", height)
            .attr("id", "dragleft")
            .attr("cursor", "ew-resize")
            .call(d3.drag()
                .on("drag", ldragresize)
                .on("end", ended));

        function ended() {
            console.log("ended: ", d3.select(this)._groups[0][0].id);
            d3.select(this).classed("dragging", false);
        }

        var dragright = newg.append("rect")
            .attr("x", function (d) {
                return d.x + width;
            })
            .attr("y", function (d) {
                return d.y;
            })
            .attr("id", "dragright")
            .attr("height", height)
            .attr("cursor", "ew-resize")
            .call(d3.drag()
                .on("drag", rdragresize)
                .on("end", ended));

        var dragtop = newg.append("rect")
            .attr("x", function (d) {
                return d.x;
            })
            .attr("y", function (d) {
                return d.y;
            })
            .attr("id", "dragtop")
            .attr("width", width)
            .attr("cursor", "ns-resize")
            .call(d3.drag()
                .on("drag", tdragresize)
                .on("end", ended));

        var dragbottom = newg.append("rect")
            .attr("x", function (d) {
                return d.x;
            })
            .attr("y", function (d) {
                return d.y + height;
            })
            .attr("id", "dragbottom")
            .attr("width", width)
            .attr("cursor", "ns-resize")
            .call(d3.drag()
                .on("drag", bdragresize)
                .on("end", ended));

        function dragmove(d) {

            console.log("id: ", d3.select(this)._groups[0][0].id);

            // drag move
            dragrect
                .attr("x", d.x = Math.max(0, Math.min(w - width, d3.event.x)));
            dragrect
                .attr("y", d.y = Math.max(0, Math.min(h - height, d3.event.y)));

            // drag left
            dragleft
                .attr("x", function (d) {
                    return d.x;
                });
            dragleft
                .attr("y", function (d) {
                    return d.y;
                });

            // drag right
            dragright
                .attr("x", function (d) {
                    return d.x + width;
                });
            dragright
                .attr("y", function (d) {
                    return d.y;
                });

            // drag top
            dragtop
                .attr("x", function (d) {
                    return d.x;
                });
            dragtop
                .attr("y", function (d) {
                    return d.y;
                });

            // drag bottom
            dragbottom
                .attr("x", function (d) {
                    return d.x;
                });
            dragbottom
                .attr("y", function (d) {
                    return d.y + height;
                });
        }

        function ldragresize(d) {

            console.log("id: ", d3.select(this)._groups[0][0].id);

            var oldx = d.x;
            //Max x on the right is x + width
            //Max x on the left is 0
            d.x = Math.max(0, Math.min(d.x + width, d3.event.x));
            width = width + (oldx - d.x);
            dragleft
                .attr("x", function (d) {
                    return d.x;
                });

            dragrect
                .attr("x", function (d) {
                    return d.x;
                })
                .attr("width", width);

            dragtop
                .attr("x", function (d) {
                    return d.x;
                })
                .attr("width", width);
            dragbottom
                .attr("x", function (d) {
                    return d.x;
                })
                .attr("width", width)
        }

        function rdragresize(d) {

            console.log("id: ", d3.select(this)._groups[0][0].id);

            //Max x on the left is x - width
            //Max x on the right is width of screen
            var dragx = Math.max(d.x, Math.min(w, d.x + width + d3.event.dx));

            //recalculate width
            width = dragx - d.x;

            //move the right drag handle
            dragright
                .attr("x", function (d) {
                    return dragx
                });

            //resize the drag rectangle
            //as we are only resizing from the right, the x coordinate does not need to change
            dragrect
                .attr("width", width);
            dragtop
                .attr("width", width)
            dragbottom
                .attr("width", width)
        }

        function tdragresize(d) {

            console.log("id: ", d3.select(this)._groups[0][0].id);

            var oldy = d.y;
            //Max x on the right is x + width
            //Max x on the left is 0
            d.y = Math.max(0, Math.min(d.y + height, d3.event.y));
            height = height + (oldy - d.y);
            dragtop
                .attr("y", function (d) {
                    return d.y;
                });

            dragrect
                .attr("y", function (d) {
                    return d.y;
                })
                .attr("height", height);

            dragleft
                .attr("y", function (d) {
                    return d.y;
                })
                .attr("height", height);
            dragright
                .attr("y", function (d) {
                    return d.y;
                })
                .attr("height", height);
        }

        function bdragresize(d) {

            console.log("id: ", d3.select(this)._groups[0][0].id);

            //Max x on the left is x - width
            //Max x on the right is width of screen
            var dragy = Math.max(d.y, Math.min(h, d.y + height + d3.event.dy));

            //recalculate width
            height = dragy - d.y;

            //move the right drag handle
            dragbottom
                .attr("y", function (d) {
                    return dragy
                });

            //resize the drag rectangle
            //as we are only resizing from the right, the x coordinate does not need to change
            dragrect
                .attr("height", height);
            dragleft
                .attr("height", height);
            dragright
                .attr("height", height);
        }

        // Circle
        var circleg = svg.append("g").data([{x: 510, y: 250}]);
        var radius = 20;

        var circle1 = circleg.append("circle")
        // .attr("transform", "translate(100, 450)")
            .attr("id", "circle")
            .attr("cx", function (d) {
                return d.x;
            })
            .attr("cy", function (d) {
                return d.y;
            })
            .attr("r", radius)
            .attr("fill", "lightgreen")
            .attr("stroke-width", 20)
            .attr("cursor", "move")
            .call(d3.drag().on("drag", dragcircle));

        function dragcircle(d) {
            d3.select(this)
                .attr("cx", d.x = d3.event.x)
                .attr("cy", d.y = d3.event.y);
        }

        var circleg2 = svg.append("g").data([{x: 560, y: 250}]);

        var circle2 = circleg2.append("circle")
        // .attr("transform", "translate(100, 500)")
            .attr("id", "circle")
            .attr("cx", function (d) {
                return d.x;
            })
            .attr("cy", function (d) {
                return d.y;
            })
            .attr("r", radius)
            .attr("fill", "orange")
            .attr("stroke-width", 20)
            .attr("cursor", "move")
            .call(d3.drag().on("drag", dragcircle));


        // Text
        var svgtext = svg.append("g").data([{x: 500, y: 30}]);

        var compartment = ["Luminal", "Serosal", "Paracellular", "Na+", "K+", "Cl-"];

        compartment.forEach(function (element, index) {
            if (index > 0)
                svgtext.data([{x: 500, y: 30 * (index + 1)}]);

            svgtext.append("text")
                .attr("id", element)
                .attr("x", function (d) {
                    return d.x;
                })
                .attr("y", function (d) {
                    return d.y;
                })
                .attr("font-family", "Times New Roman")
                .attr("font-size", "20px")
                .attr("fill", "red")
                .attr("cursor", "move")
                .text(element);
        });

        svgtext.selectAll("text")
            .call(d3.drag()
                .on("drag", dragtext)
                .on("end", dragendtext));

        function dragtext(d) {
            d3.select(this)
                .attr("pointer-events", "none") // hide text and make visible rectangles
                .attr("x", d.x = d3.event.x)
                .attr("y", d.y = d3.event.y);
        }

        function dragendtext(d) {
            d3.select(this)
                .classed("dragging", false)
                .attr("pointer-events", "all");
            console.log("dragendtext: ", d3.select(this)._groups[0][0].id);
        }

        // Mouse over and out event
        // d3.select("rect").on("mouseover", function () {
        //     d3.select(this).style("fill", "green");
        // });
        //
        // d3.select("rect").on("mouseout", function () {
        //     d3.select(this).style("fill", "white");
        // });

        var markerWidth = 4;
        var markerHeight = 4;

        // build the start arrow.
        svg.append("svg:defs")
            .selectAll("marker")
            .data(["start"])      // Different link/path types can be defined here
            .enter().append("svg:marker")    // This section adds in the arrows
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 1)
            .attr("refY", -0.25)
            .attr("markerWidth", markerWidth)
            .attr("markerHeight", markerHeight)
            .attr("orient", "180")
            .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");

        // build the end arrow.
        svg.append("svg:defs").selectAll("marker")
            .data(["end"])      // Different link/path types can be defined here
            .enter().append("svg:marker")    // This section adds in the arrows
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 1)
            .attr("refY", -0.25)
            .attr("markerWidth", markerWidth)
            .attr("markerHeight", markerHeight)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");

        // Line
        var svgline = svg.append("g").data([{x: 500, y: 200}]);
        var lineLen = 40;

        var line = svgline.append("line")
            .attr("id", "lineLuminal")
            .attr("x1", function (d) {
                return d.x;
            })
            .attr("y1", function (d) {
                return d.y;
            })
            .attr("x2", function (d) {
                return d.x + lineLen;
            })
            .attr("y2", function (d) {
                return d.y;
            })
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("marker-end", "url(#end)") // marker-start for start marker
            .attr("cursor", "pointer")
            .call(d3.drag()
                .on("drag", dragline)
                .on("end", dragendline));

        function dragline(d) {
            var axis = groupcordinates("lineLuminal");
            line.attr("x1", axis.shift())
                .attr("y1", axis.shift())
                .attr("x2", axis.shift())
                .attr("y2", axis.shift());
        }

        function dragendline(d) {
            d3.select(this)
                .classed("dragging", false);
            console.log("dragendline: ", d3.select(this)._groups[0][0].id);
        }

        // Utility for marker direction
        function markerDir(selecttion) {
            var mstart = d3.select("#" + selecttion + "")
                ._groups[0][0]
                .getAttribute("marker-start");

            var mend = d3.select("#" + selecttion + "")
                ._groups[0][0]
                .getAttribute("marker-end");

            if (mstart == "") {
                d3.select("#" + selecttion + "")
                    .attr("marker-start", "url(#start)")
                    .attr("marker-end", "");
            }
            else {
                d3.select("#" + selecttion + "")
                    .attr("marker-end", "url(#end)")
                    .attr("marker-start", "");
            }

            if (mend == "") {
                d3.select("#" + selecttion + "")
                    .attr("marker-end", "url(#end)")
                    .attr("marker-start", "");
            }
            else {
                d3.select("#" + selecttion + "")
                    .attr("marker-start", "url(#start)")
                    .attr("marker-end", "");
            }
        }

        // Click to change the marker direction
        d3.select("#lineLuminal").on("click", function () {
            markerDir("lineLuminal");
        });

        // Polygon with arrow lines
        var polygonwitharrowsg = svg.append("g").data([{x: 490, y: 325}]);
        var polygonlineLen = 60;

        var polygonmarkerend = polygonwitharrowsg.append("line")
            .attr("id", "polygonmarkerend")
            .attr("x1", function (d) {
                return d.x;
            })
            .attr("y1", function (d) {
                return d.y;
            })
            .attr("x2", function (d) {
                return d.x + polygonlineLen;
            })
            .attr("y2", function (d) {
                return d.y;
            })
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("marker-end", "url(#end)")
            .attr("cursor", "pointer")
            .call(d3.drag().on("drag", dragpolygonandline));

        // Click to change the marker direction
        d3.select("#polygonmarkerend").on("click", function () {
            markerDir("polygonmarkerend");
        });

        // Polygon
        var polygonmarker = svg.append("g").append("polygon")
            .attr("transform", "translate(500,300)")
            .attr("id", "channel")
            // .attr("points", "10,10 30,10 40,25 30,40 10,40 0,25")
            .attr("points", "10,15 30,15 40,25 30,35 10,35 0,25")
            .attr("fill", "yellow")
            .attr("stroke", "black")
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")
            .attr("cursor", "move")
            .call(d3.drag().on("drag", dragpolygonandline));

        function dragpolygonandline(d) {

            // polygon line
            var axis = groupcordinates("polygonmarkerend");
            polygonmarkerend
                .attr("x1", axis.shift())
                .attr("y1", axis.shift())
                .attr("x2", axis.shift())
                .attr("y2", axis.shift());

            // polygon
            var dx = d3.event.dx;
            var dy = d3.event.dy;

            var xNew = [], yNew = [], points = "";
            var pointsLen = d3.select(this)._groups[0][0].points.length;

            for (var i = 0; i < pointsLen; i++) {
                xNew[i] = parseFloat(d3.select(this)._groups[0][0].points[i].x) + dx;
                yNew[i] = parseFloat(d3.select(this)._groups[0][0].points[i].y) + dy;

                points = points.concat("" + xNew[i] + "").concat(",").concat("" + yNew[i] + "");

                if (i != pointsLen - 1)
                    points = points.concat(" ");
            }

            d3.select(this).attr("points", points);
            console.log("polygon: ", d3.select(this).attr("points"));
        }

        function dragpolygon(d) {
            var dx = d3.event.dx;
            var dy = d3.event.dy;

            var xNew = [], yNew = [], points = "";
            var pointsLen = d3.select(this)._groups[0][0].points.length;

            for (var i = 0; i < pointsLen; i++) {
                xNew[i] = parseFloat(d3.select(this)._groups[0][0].points[i].x) + dx;
                yNew[i] = parseFloat(d3.select(this)._groups[0][0].points[i].y) + dy;

                points = points.concat("" + xNew[i] + "").concat(",").concat("" + yNew[i] + "");

                if (i != pointsLen - 1)
                    points = points.concat(" ");
            }

            d3.select(this).attr("points", points);
            console.log("polygon: ", d3.select(this).attr("points"));
        }

        // Paracellular Rectangle
        svg.append("g").append("polygon")
            .attr("transform", "translate(100,540)")
            .attr("id", "paracellular")
            .attr("points", "0,0 0,100 0,0 300,0 300,100 300,0")
            .attr("fill", "white")
            .attr("stroke", "url(#basicPattern)")
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", 20)
            .attr("cursor", "move")
            .call(d3.drag().on("drag", dragpolygon));

        // Circle with arrow lines
        var circlewitharrowsg = svg.append("g").data([{x: 500, y: 450}]);

        var linemarkerend = circlewitharrowsg.append("line")
            .attr("id", "linemarkerend")
            .attr("x1", function (d) {
                return d.x;
            })
            .attr("y1", function (d) {
                return d.y;
            })
            .attr("x2", function (d) {
                return d.x + lineLen;
            })
            .attr("y2", function (d) {
                return d.y;
            })
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("marker-end", "url(#end)")
            .attr("cursor", "pointer")
            .call(d3.drag().on("drag", dragcircleandline));

        var linemarkerstart = circlewitharrowsg.append("line")
            .attr("id", "linemarkerstart")
            .attr("x1", function (d) {
                return d.x;
            })
            .attr("y1", function (d) {
                return d.y + lineLen;
            })
            .attr("x2", function (d) {
                return d.x + lineLen;
            })
            .attr("y2", function (d) {
                return d.y + lineLen;
            })
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("marker-start", "url(#start)")
            .attr("cursor", "pointer")
            .call(d3.drag().on("drag", dragcircleandline));

        var circlemarker = circlewitharrowsg.append("circle")
            .attr("id", "circlemarker")
            .attr("cx", function (d) {
                return d.x + radius;
            })
            .attr("cy", function (d) {
                return d.y + radius;
            })
            .attr("r", radius)
            .attr("fill", "SteelBlue")
            .attr("stroke-width", 20)
            .attr("cursor", "move")
            .call(d3.drag().on("drag", dragcircleandline));

        // Click to change the marker direction
        d3.select("#linemarkerend").on("click", function () {
            markerDir("linemarkerend");
        });

        d3.select("#linemarkerstart").on("click", function () {
            markerDir("linemarkerstart");
        });

        // TODO: make generic for all shapes
        function groupcordinates(groups) {

            var dx = d3.event.dx;
            var dy = d3.event.dy;

            // Circle groups
            if (groups == "circlemarker") {
                var cxNew = parseFloat(d3.select("#" + groups + "").attr("cx")) + dx;
                var cyNew = parseFloat(d3.select("#" + groups + "").attr("cy")) + dy;

                return [cxNew, cyNew];
            } else { // Line groups

                var x1New = parseFloat(d3.select("#" + groups + "").attr("x1")) + dx;
                var y1New = parseFloat(d3.select("#" + groups + "").attr("y1")) + dy;
                var x2New = parseFloat(d3.select("#" + groups + "").attr("x2")) + dx;
                var y2New = parseFloat(d3.select("#" + groups + "").attr("y2")) + dy;

                return [x1New, y1New, x2New, y2New];
            }
        }

        function dragcircleandline(d) {

            // circle line
            var axis = groupcordinates("linemarkerend");
            linemarkerend
                .attr("x1", axis.shift())
                .attr("y1", axis.shift())
                .attr("x2", axis.shift())
                .attr("y2", axis.shift());

            var axis = groupcordinates("linemarkerstart");
            linemarkerstart
                .attr("x1", axis.shift())
                .attr("y1", axis.shift())
                .attr("x2", axis.shift())
                .attr("y2", axis.shift());

            // Circle
            var axis = groupcordinates("circlemarker");
            circlemarker
                .attr("cx", axis.shift())
                .attr("cy", axis.shift());
        }
    }

    // Expose utility to the global object
    global.$mainUtils = mainUtils;
})(window);