/// <reference path="app.ts" />
/// <reference path="inspection.ts" />
/// <reference path="shortinspection.ts" />
var InspSched;
(function (InspSched) {
    var InspectorUI;
    (function (InspectorUI) {
        function LoadDailyInspections() {
            InspSched.transport.DailyInspections().then(function (inspections) {
                InspSched.IVInspections = inspections;
                console.log('inspections', inspections);
                if (InspSched.IVInspections.length > 0) {
                    if (InspSched.Inspectors.length === 0) {
                        LoadInspectors();
                    }
                    BuildInspectorUI();
                }
            }, function () {
                console.log('error in LoadInspectionTypes');
                InspSched.IVInspections = [];
            });
        }
        InspectorUI.LoadDailyInspections = LoadDailyInspections;
        function ShowInspectionTab() {
            var e = document.getElementById("InspectorViewTab");
            e.style.display = "flex";
        }
        function LoadInspectors() {
            InspSched.transport.Inspectors().then(function (inspectors) {
                var developmentcheck = document.getElementById("isDevelopment");
                if (inspectors[0].InDevelopment) {
                    InspSched.UI.Hide('inspector-contact-link');
                    developmentcheck.textContent = "Dev Environment";
                }
                InspSched.Inspectors = inspectors;
                PopulateInspectorDropdown();
            }, function () {
                console.log('error in LoadInspectionTypes');
                InspSched.IVInspections = [];
            });
        }
        function PopulateInspectorDropdown() {
            var ddl = document.getElementById('InspectorList');
            for (var _i = 0, _a = InspSched.Inspectors; _i < _a.length; _i++) {
                var i = _a[_i];
                var o = document.createElement("option");
                o.value = i.Name;
                o.appendChild(document.createTextNode(i.Name));
                ddl.options.add(o);
            }
        }
        function BuildInspectorUI() {
            ShowInspectionTab(); // this shows the Inspector View Tab thinger
            // this function will take the 
            // IV data and create the html
            // and add it to the InspectorViewInspections div
            if (InspSched.HideTheseComments.length === 0) {
                PopulateBadComments();
            }
            var target = document.getElementById("InspectorViewInspections");
            InspSched.UI.clearElement(target);
            var currentHash = new InspSched.LocationHash(location.hash.substring(1));
            // Let's get our filters.
            var inspector = document.getElementById("InspectorList").value;
            var day = document.querySelector('input[name="day"]:checked').value;
            var viewType = document.querySelector('input[name="view"]:checked').value;
            var open = document.querySelector('input[name="status"]:checked').value;
            // We're going to filter our results if a day or inspector was passed.
            var isOpen = open === "Open";
            if (viewType === "address") {
                InspSched.InspectorViewByAddress = ProcessIVInspectionsByAddress(InspSched.IVInspections, inspector, day, open, isOpen);
                console.log('inspectorviewbyaddress', InspSched.InspectorViewByAddress);
                BuildInspectorViewByAddress(target, currentHash);
            }
            else {
                InspSched.InspectorViewByPermit = ProcessIVInspectionsByPermit(InspSched.IVInspections, inspector, day, open, isOpen);
                BuildInspectorViewByPermit(target, currentHash);
            }
        }
        InspectorUI.BuildInspectorUI = BuildInspectorUI;
        function BuildInspectorViewByAddress(target, currentHash) {
            var df = document.createDocumentFragment();
            df.appendChild(BuildInspectorViewByAddressHeaderRow());
            if (InspSched.InspectorViewByAddress.length > 0) {
                for (var _i = 0, _a = InspSched.InspectorViewByAddress; _i < _a.length; _i++) {
                    var i = _a[_i];
                    df.appendChild(BuildInspectorViewByAddressRow(i, currentHash));
                }
            }
            target.appendChild(df);
        }
        function BuildInspectorViewByPermit(target, currentHash) {
            var df = document.createDocumentFragment();
            df.appendChild(BuildInspectorViewByPermitHeaderRow());
            if (InspSched.InspectorViewByPermit.length > 0) {
                for (var _i = 0, _a = InspSched.InspectorViewByPermit; _i < _a.length; _i++) {
                    var i = _a[_i];
                    df.appendChild(BuildInspectorViewByPermitRow(i, currentHash));
                }
            }
            target.appendChild(df);
        }
        function BuildInspectorViewByPermitHeaderRow() {
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
        function BuildInspectorViewByPermitRow(i, ch) {
            var df = document.createDocumentFragment();
            var row = document.createElement("div");
            row.classList.add("row");
            row.classList.add("no-page-break");
            row.classList.add("flex-container");
            row.classList.add("medium-12");
            row.classList.add("large-12");
            row.style.borderBottom = "solid 1px Black";
            row.style.marginTop = ".5em";
            ch.Permit = i.PermitNumber;
            ch.InspectionId = 0;
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
        function CreateAndSetSmaller(v) {
            var c = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                c[_i - 1] = arguments[_i];
            }
            var e = document.createElement("div");
            e.classList.add("align-middle");
            e.classList.add("small-12");
            e.classList.add("align-center");
            e.classList.add("flex-container");
            e.style.fontSize = "smaller";
            e.appendChild(document.createTextNode(v));
            if (c.length > 0) {
                for (var _a = 0, c_2 = c; _a < c_2.length; _a++) {
                    var i = c_2[_a];
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
                for (var _a = 0, c_3 = c; _a < c_3.length; _a++) {
                    var i = c_3[_a];
                    a.classList.add(i);
                }
            }
            return a;
        }
        function CreateTargettedLink(v, l, target) {
            var c = [];
            for (var _i = 3; _i < arguments.length; _i++) {
                c[_i - 3] = arguments[_i];
            }
            var a = document.createElement("a");
            a.href = l;
            a.appendChild(document.createTextNode(v));
            a.target = target;
            if (c.length > 0) {
                for (var _a = 0, c_4 = c; _a < c_4.length; _a++) {
                    var i = c_4[_a];
                    a.classList.add(i);
                }
            }
            return a;
        }
        function ProcessIVInspectionsByPermit(inspections, inspector, day, open, isOpen) {
            var ivList = [];
            // if we have a day or inspector set to filter on
            // let's go ahead and filter the list of inspections
            // based on them.
            var d = new Date();
            var fInspections = inspections.filter(function (i) {
                var inspectorCheck = inspector.length > 0 ? i.InspectorName === inspector : true;
                var dayCheck = day.length > 0 ? i.Day === day || (day === "Today" && i.ResultADC === "" && new Date(i.SchedDateTime.toString()) < d) : true;
                console.log("i.scheddatetime", i.SchedDateTime, "d", d);
                var openCheck = true;
                if (open.length === 0) {
                    openCheck = true;
                }
                else {
                    if (isOpen) {
                        openCheck = i.ResultADC.length === 0;
                    }
                    else {
                        openCheck = i.ResultADC.length > 0;
                    }
                }
                return inspectorCheck && dayCheck && openCheck;
            });
            // get a unique list of permit numbers.
            var permitNumbers = fInspections.map(function (p) {
                return p.PermitNo;
            });
            permitNumbers = permitNumbers.filter(function (value, index, self) { return index === self.indexOf(value); });
            var _loop_1 = function (p) {
                var i = fInspections.filter(function (j) {
                    return j.PermitNo === p;
                });
                var iv = new InspSched.InspectionViewByPermit(i[0]); // we'll base the inspectorView off of the first inspection returned.
                iv.Inspections = i.map(function (insp) {
                    return new InspSched.ShortInspection(insp);
                });
                ivList.push(iv);
            };
            // let's coerce the inspection data into the IV format.
            for (var _i = 0, permitNumbers_1 = permitNumbers; _i < permitNumbers_1.length; _i++) {
                var p = permitNumbers_1[_i];
                _loop_1(p);
            }
            return ivList;
        }
        InspectorUI.ProcessIVInspectionsByPermit = ProcessIVInspectionsByPermit;
        function ProcessIVInspectionsByAddress(inspections, inspector, day, open, isOpen) {
            var ivList = [];
            // if we have a day or inspector set to filter on
            // let's go ahead and filter the list of inspections
            // based on them.
            var d = new Date();
            var fInspections = inspections.filter(function (i) {
                var inspectorCheck = inspector.length > 0 ? i.InspectorName === inspector : true;
                var dayCheck = day.length > 0 ? i.Day === day || (day === "Today" && i.ResultADC === "" && new Date(i.SchedDateTime.toString()) < d) : true;
                var openCheck = true;
                if (open.length === 0) {
                    openCheck = true;
                }
                else {
                    if (isOpen) {
                        openCheck = i.ResultADC.length === 0;
                    }
                    else {
                        openCheck = i.ResultADC.length > 0;
                    }
                }
                return inspectorCheck && dayCheck && openCheck;
            });
            // get a unique list of addresses.
            var addresses = fInspections.map(function (p) {
                return p.StreetAddress;
            });
            addresses = addresses.filter(function (value, index, self) { return index === self.indexOf(value); });
            console.log('addresses', addresses);
            var _loop_2 = function (a) {
                var i = fInspections.filter(function (j) {
                    return j.StreetAddress === a;
                });
                var iv = new InspSched.InspectionViewByAddress(i[0]); // we'll base the inspectorView off of the first inspection returned.
                iv.Inspections = i.map(function (insp) {
                    return new InspSched.ShortInspection(insp);
                });
                ivList.push(iv);
            };
            // let's coerce the inspection data into the IV format.
            for (var _i = 0, addresses_1 = addresses; _i < addresses_1.length; _i++) {
                var a = addresses_1[_i];
                _loop_2(a);
            }
            return ivList;
        }
        InspectorUI.ProcessIVInspectionsByAddress = ProcessIVInspectionsByAddress;
        function BuildInspectorViewByAddressHeaderRow() {
            var df = document.createDocumentFragment();
            var row = document.createElement("div");
            row.classList.add("row");
            row.classList.add("flex-container");
            row.classList.add("medium-12");
            row.classList.add("large-12");
            row.style.borderBottom = "solid 1px Black";
            var address = CreateAndSet("Address");
            var addressColumn = document.createElement("div");
            addressColumn.classList.add("flex-container");
            addressColumn.classList.add("columns");
            addressColumn.classList.add("medium-3");
            addressColumn.classList.add("align-middle");
            addressColumn.classList.add("align-center");
            addressColumn.appendChild(address);
            var inspector = CreateAndSet("Inspector");
            var inspectorColumn = document.createElement("div");
            inspectorColumn.classList.add("flex-container");
            inspectorColumn.classList.add("columns");
            inspectorColumn.classList.add("medium-2");
            inspectorColumn.classList.add("align-middle");
            inspectorColumn.classList.add("align-center");
            inspectorColumn.appendChild(inspector);
            row.appendChild(addressColumn);
            row.appendChild(inspectorColumn);
            var secondcolumn = document.createElement("div");
            secondcolumn.classList.add("columns");
            secondcolumn.classList.add("medium-7");
            secondcolumn.classList.add("large-7");
            secondcolumn.classList.add("end");
            var firstRow = document.createElement("div");
            firstRow.classList.add("row");
            firstRow.classList.add("medium-12");
            firstRow.classList.add("large-12");
            firstRow.appendChild(CreateAndSet("Permit", "columns", "small-4"));
            firstRow.appendChild(CreateAndSet("Type", "columns", "small-6"));
            firstRow.appendChild(CreateAndSet("Status", "columns", "small-2"));
            //firstRow.appendChild(CreateAndSet("Comments", "columns", "small-7"));
            secondcolumn.appendChild(firstRow);
            row.appendChild(secondcolumn);
            df.appendChild(row);
            return df;
        }
        function BuildInspectorViewByAddressRow(i, ch) {
            var df = document.createDocumentFragment();
            var row = document.createElement("div");
            row.classList.add("row");
            row.classList.add("no-page-break");
            row.classList.add("flex-container");
            row.classList.add("medium-12");
            row.classList.add("large-12");
            row.style.borderBottom = "solid 1px Black";
            row.style.marginTop = ".5em";
            ch.Permit = i.Address;
            ch.InspectionId = 0;
            var address = CreateTargettedLink(i.Address, "http://apps.claycountygov.com/inspectionview/#inspectionid=" + i.Inspections[0].InspectionId.toString(), "inspectionview");
            var addressContainer = document.createElement("div");
            var addressContainerContainer = document.createElement("div");
            addressContainerContainer.classList.add("row");
            addressContainerContainer.classList.add("small-12");
            addressContainer.classList.add("flex-container");
            addressContainer.classList.add("small-12");
            addressContainer.classList.add("align-middle");
            addressContainer.classList.add("align-center");
            addressContainer.appendChild(address);
            addressContainerContainer.appendChild(addressContainer);
            var addressColumn = document.createElement("div");
            addressColumn.classList.add("column");
            addressColumn.classList.add("medium-3");
            addressColumn.classList.add("align-middle");
            addressColumn.classList.add("align-center");
            addressColumn.classList.add("flex-container");
            if (i.FloodZone.length > 0) {
                addressContainerContainer.appendChild(CreateAndSetSmaller("FloodZone: " + i.FloodZone + ", Geozone: " + i.GeoZone));
            }
            else {
                addressContainerContainer.appendChild(CreateAndSetSmaller("Geozone: " + i.GeoZone));
            }
            if (i.IsPrivateProvider) {
                addressContainerContainer.appendChild(CreateAndSetSmaller("Private Provider"));
            }
            if (i.IsCommercial) {
                addressContainerContainer.appendChild(CreateAndSetSmaller("Commercial"));
            }
            addressColumn.appendChild(addressContainerContainer);
            row.appendChild(addressColumn);
            var inspectorContainer = document.createElement("div");
            inspectorContainer.classList.add("column");
            inspectorContainer.classList.add("medium-2");
            inspectorContainer.classList.add("align-middle");
            inspectorContainer.classList.add("align-center");
            inspectorContainer.classList.add("flex-container");
            inspectorContainer.appendChild(CreateAndSet(i.Inspector));
            row.appendChild(inspectorContainer);
            var secondcolumn = document.createElement("div");
            secondcolumn.classList.add("columns");
            secondcolumn.classList.add("medium-7");
            secondcolumn.classList.add("large-7");
            secondcolumn.classList.add("end");
            for (var _i = 0, _a = i.Inspections; _i < _a.length; _i++) {
                var insp = _a[_i];
                var row_1 = document.createElement("div");
                row_1.classList.add("row");
                row_1.classList.add("medium-12");
                row_1.classList.add("large-12");
                ch.Permit = insp.PermitNumber;
                ch.InspectionId = insp.InspectionId;
                row_1.appendChild(CreateAndSet(insp.PermitNumber, "columns", "small-4"));
                row_1.appendChild(CreateLink(insp.InspectionDesc, ch.ToHash(), "medium-6", "columns"));
                row_1.appendChild(CreateAndSet(insp.ResultADC, "columns", "small-2"));
                var secondRow = document.createElement("div");
                secondRow.classList.add("row");
                secondRow.classList.add("medium-12");
                secondRow.classList.add("large-12");
                secondRow.appendChild(CreateAndSet(CleanComments(insp.Comments)));
                secondcolumn.appendChild(row_1);
                secondcolumn.appendChild(secondRow);
            }
            row.appendChild(secondcolumn);
            df.appendChild(row);
            return df;
        }
        function CleanComments(comments) {
            var c = [];
            var split = comments.trim().split("\r\n");
            for (var _i = 0, split_1 = split; _i < split_1.length; _i++) {
                var s = split_1[_i];
                if (!MatchBadComments(s)) {
                    c.push(s);
                }
            }
            //console.log('split', split);
            return c.join("\r\n");
        }
        function PopulateBadComments() {
            // these will need to be lower case.
            InspSched.HideTheseComments = [
                "request created",
                "status changed from"
            ];
        }
        function MatchBadComments(comment) {
            comment = comment.toLowerCase();
            for (var _i = 0, _a = InspSched.HideTheseComments; _i < _a.length; _i++) {
                var c = _a[_i];
                if (comment.indexOf(c) !== -1) {
                    return true;
                }
            }
            return false;
        }
    })(InspectorUI = InspSched.InspectorUI || (InspSched.InspectorUI = {}));
})(InspSched || (InspSched = {}));
//# sourceMappingURL=inspectorui.js.map