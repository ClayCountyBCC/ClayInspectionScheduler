/// <reference path="app.ts" />
/// <reference path="inspection.ts" />
/// <reference path="inspectorview.ts" />
/// <reference path="shortinspection.ts" />


namespace InspSched.InspectorUI
{

  export function LoadDailyInspections()
  {

    transport.DailyInspections().then(function (inspections: Array<Inspection>)
    {
      InspSched.IVInspections = inspections;
      if (InspSched.IVInspections.length > 0)
      {
        let iv = new InspectorView();
        InspSched.IV = iv.ProcessIVData(inspections);
        BuildInspectorUI();
      }
    },
      function ()
      {
        console.log('error in LoadInspectionTypes');
        InspSched.IVInspections = [];
      });
  }

  function BuildInspectorUI()
  {
    // this function will take the 
    // IV data and create the html
    // and add it to the InspectorViewInspections div
    let currentHash = new LocationHash(location.hash.substring(1));
    let target = document.getElementById("InspectorViewInspections");
    let df: DocumentFragment = document.createDocumentFragment();
    UI.clearElement(target);
    if (InspSched.IV.length > 0)
    {
      df.appendChild(BuildHeaderRow());
      for (let i of InspSched.IV)
      {
        df.appendChild(BuildRow(i, currentHash));
      }
    }
    target.appendChild(df);
  }

  function BuildHeaderRow(): DocumentFragment  
  {
    let df = document.createDocumentFragment();
    let row = document.createElement("div");
    row.classList.add("row");
    row.classList.add("flex-container");
    row.classList.add("medium-12");
    row.classList.add("large-12");
    row.style.borderBottom = "solid 1px Black";
    let permit = CreateAndSet("Permit");
    let permitColumn = document.createElement("div");
    permitColumn.classList.add("flex-container");
    permitColumn.classList.add("columns");
    permitColumn.classList.add("align-middle");
    permitColumn.classList.add("align-center");
    permitColumn.appendChild(permit);
    row.appendChild(permitColumn);
    let secondcolumn = document.createElement("div");
    secondcolumn.classList.add("columns");
    secondcolumn.classList.add("medium-10");
    secondcolumn.classList.add("large-10");
    secondcolumn.classList.add("end");
    let firstRow = document.createElement("div");
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

  function BuildRow(i: InspectorView, ch: LocationHash): DocumentFragment
  {
    let df = document.createDocumentFragment();
    let row = document.createElement("div");
    row.classList.add("row");
    row.classList.add("flex-container");
    row.classList.add("medium-12");
    row.classList.add("large-12");
    row.style.borderBottom = "solid 1px Black";
    row.style.marginTop = ".5em";
    ch.Permit = i.PermitNumber;
    let permit = CreateLink(i.PermitNumber, ch.ToHash());
    let permitContainer = document.createElement("div");
    let permitContainerContainer = document.createElement("div");
    permitContainerContainer.classList.add("row");
    permitContainerContainer.classList.add("small-12");
    permitContainer.classList.add("flex-container");
    permitContainer.classList.add("small-12");
    permitContainer.classList.add("align-middle");
    permitContainer.classList.add("align-center");
    permitContainer.appendChild(permit);
    permitContainerContainer.appendChild(permitContainer);
    let permitColumn = document.createElement("div");
    permitColumn.classList.add("column");
    permitColumn.classList.add("medium-2");
    permitColumn.classList.add("align-middle");
    permitColumn.classList.add("align-center");
    permitColumn.classList.add("flex-container");
    if (i.IsPrivateProvider)
    {
      let pp = CreateAndSet("Private Provider");
      pp.classList.add("align-middle");
      pp.classList.add("small-12");
      pp.classList.add("align-center");
      pp.classList.add("flex-container");
      pp.style.fontSize = "smaller";
      permitContainerContainer.appendChild(pp);
    }
    permitColumn.appendChild(permitContainerContainer);
    row.appendChild(permitColumn);
    let secondcolumn = document.createElement("div");
    secondcolumn.classList.add("columns");
    secondcolumn.classList.add("medium-10");
    secondcolumn.classList.add("large-10");
    secondcolumn.classList.add("end");
    let firstRow = document.createElement("div");
    firstRow.classList.add("row");
    firstRow.classList.add("medium-12");
    firstRow.classList.add("large-12");
    firstRow.appendChild(CreateAndSet(i.Address, "columns", "small-4"));
    firstRow.appendChild(CreateAndSet(i.Inspector, "columns", "small-4"));
    firstRow.appendChild(CreateAndSet(i.GeoZone, "columns", "small-2"));
    firstRow.appendChild(CreateAndSet(i.FloodZone, "columns", "small-2"));
    secondcolumn.appendChild(firstRow);
    let secondRow = document.createElement("div");
    secondRow.classList.add("row");
    secondRow.classList.add("medium-12");
    secondRow.classList.add("large-12");
    for (let insp of i.Inspections)
    {
      ch.InspectionId = insp.InspectionId;
      secondRow.appendChild(CreateLink(insp.InspectionDesc, ch.ToHash(), "medium-4", "columns"));
    }
    secondcolumn.appendChild(secondRow);
    row.appendChild(secondcolumn);
    df.appendChild(row);
    return df;
  }

  function CreateAndSet(v: string, ...c: string[]): HTMLDivElement
  {
    let e = document.createElement("div");
    e.appendChild(document.createTextNode(v));
    if (c.length > 0)
    {
      for (let i of c)
      {
        e.classList.add(i); // optional class
      }
    }
    return e;
  }

  function CreateLink(v: string, l: string, ...c: string[]): HTMLAnchorElement
  {
    let a = document.createElement("a");
    a.href = l;
    a.appendChild(document.createTextNode(v));
    if (c.length > 0)
    {
      for (let i of c)
      {
        a.classList.add(i);
      }
    }
    return a;
  }





}