/// <reference path="app.ts" />
/// <reference path="inspection.ts" />
/// <reference path="inspectorview.ts" />
/// <reference path="shortinspection.ts" />
var InspSched;
(function (InspSched) {
    var InspectorUI;
    (function (InspectorUI) {
        function LoadDailyInspections() {
            InspSched.transport.DailyInspections().then(function (inspections) {
                InspSched.IVInspections = inspections;
                if (InspSched.IVInspections.length > 0) {
                    var iv = new InspSched.InspectorView();
                    InspSched.IV = iv.ProcessIVData(inspections);
                    BuildInspectorUI();
                }
            }, function () {
                console.log('error in LoadInspectionTypes');
                InspSched.IVInspections = [];
            });
        }
        InspectorUI.LoadDailyInspections = LoadDailyInspections;
        function BuildInspectorUI() {
            // this function will take the 
            // IV data and create the html
            // and add it to the InspectorViewInspections div
            var currentHash = new InspSched.LocationHash(location.hash.substring(1));
            var target = document.getElementById("InspectorViewInspections");
            var df = document.createDocumentFragment();
            InspSched.UI.clearElement(target);
            if (InspSched.IV.length > 0) {
                df.appendChild(BuildHeaderRow());
                for (var _i = 0, _a = InspSched.IV; _i < _a.length; _i++) {
                    var i = _a[_i];
                    df.appendChild(BuildRow(i, currentHash));
                }
            }
            target.appendChild(df);
        }
        function BuildHeaderRow() {
            var df = document.createDocumentFragment();
            var row = document.createElement("div");
            row.classList.add("row");
            row.classList.add("flex-container");
            row.classList.add("medium-12");
            row.classList.add("large-12");
            row.style.borderBottom = "solid 1px Black";
            var permit = CreateAndSet("Permit");
            var permitColumn = document.createElement("div");
            permitColumn.classList.add("flex-container");
            permitColumn.classList.add("columns");
            permitColumn.classList.add("align-middle");
            permitColumn.classList.add("align-center");
            permitColumn.appendChild(permit);
            row.appendChild(permitColumn);
            var secondcolumn = document.createElement("div");
            secondcolumn.classList.add("columns");
            secondcolumn.classList.add("medium-10");
            secondcolumn.classList.add("large-10");
            secondcolumn.classList.add("end");
            var firstRow = document.createElement("div");
            firstRow.classList.add("row");
            firstRow.classList.add("medium-12");
            firstRow.classList.add("large-12");
            firstRow.appendChild(CreateAndSet("Address", "columns", "small-4"));
            firstRow.appendChild(CreateAndSet("Inspector", "columns", "small-4"));
            firstRow.appendChild(CreateAndSet("GeoZone", "columns", "small-2"));
            firstRow.appendChild(CreateAndSet("FloodZone", "columns", "small-2"));
            secondcolumn.appendChild(firstRow);
            row.appendChild(secondcolumn);
            df.appendChild(row);
            return df;
        }
        function BuildRow(i, ch) {
            var df = document.createDocumentFragment();
            var row = document.createElement("div");
            row.classList.add("row");
            row.classList.add("flex-container");
            row.classList.add("medium-12");
            row.classList.add("large-12");
            row.style.borderBottom = "solid 1px Black";
            row.style.marginTop = ".5em";
            ch.Permit = i.PermitNumber;
            var permit = CreateLink(i.PermitNumber, ch.ToHash());
            var permitContainer = document.createElement("div");
            var permitContainerContainer = document.createElement("div");
            permitContainerContainer.classList.add("row");
            permitContainerContainer.classList.add("small-12");
            permitContainer.classList.add("flex-container");
            permitContainer.classList.add("small-12");
            permitContainer.classList.add("align-middle");
            permitContainer.classList.add("align-center");
            permitContainer.appendChild(permit);
            permitContainerContainer.appendChild(permitContainer);
            var permitColumn = document.createElement("div");
            permitColumn.classList.add("column");
            permitColumn.classList.add("medium-2");
            permitColumn.classList.add("align-middle");
            permitColumn.classList.add("align-center");
            permitColumn.classList.add("flex-container");
            if (i.IsPrivateProvider) {
                var pp = CreateAndSet("Private Provider");
                pp.classList.add("align-middle");
                pp.classList.add("small-12");
                pp.classList.add("align-center");
                pp.classList.add("flex-container");
                pp.style.fontSize = "smaller";
                permitContainerContainer.appendChild(pp);
            }
            permitColumn.appendChild(permitContainerContainer);
            row.appendChild(permitColumn);
            var secondcolumn = document.createElement("div");
            secondcolumn.classList.add("columns");
            secondcolumn.classList.add("medium-10");
            secondcolumn.classList.add("large-10");
            secondcolumn.classList.add("end");
            var firstRow = document.createElement("div");
            firstRow.classList.add("row");
            firstRow.classList.add("medium-12");
            firstRow.classList.add("large-12");
            firstRow.appendChild(CreateAndSet(i.Address, "columns", "small-4"));
            firstRow.appendChild(CreateAndSet(i.Inspector, "columns", "small-4"));
            firstRow.appendChild(CreateAndSet(i.GeoZone, "columns", "small-2"));
            firstRow.appendChild(CreateAndSet(i.FloodZone, "columns", "small-2"));
            secondcolumn.appendChild(firstRow);
            var secondRow = document.createElement("div");
            secondRow.classList.add("row");
            secondRow.classList.add("medium-12");
            secondRow.classList.add("large-12");
            for (var _i = 0, _a = i.Inspections; _i < _a.length; _i++) {
                var insp = _a[_i];
                ch.InspectionId = insp.InspectionId;
                secondRow.appendChild(CreateLink(insp.InspectionDesc, ch.ToHash(), "medium-4", "columns"));
            }
            secondcolumn.appendChild(secondRow);
            row.appendChild(secondcolumn);
            df.appendChild(row);
            return df;
        }
        function CreateAndSet(v) {
            var c = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                c[_i - 1] = arguments[_i];
            }
            var e = document.createElement("div");
            e.appendChild(document.createTextNode(v));
            if (c.length > 0) {
                for (var _a = 0, c_1 = c; _a < c_1.length; _a++) {
                    var i = c_1[_a];
                    e.classList.add(i); // optional class
                }
            }
            return e;
        }
        function CreateLink(v, l) {
            var c = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                c[_i - 2] = arguments[_i];
            }
            var a = document.createElement("a");
            a.href = l;
            a.appendChild(document.createTextNode(v));
            if (c.length > 0) {
                for (var _a = 0, c_2 = c; _a < c_2.length; _a++) {
                    var i = c_2[_a];
                    a.classList.add(i);
                }
            }
            return a;
        }
    })(InspectorUI = InspSched.InspectorUI || (InspSched.InspectorUI = {}));
})(InspSched || (InspSched = {}));
//# sourceMappingURL=inspectorui.js.map