/// <reference path="shortinspection.ts" />
namespace InspSched
{
  interface IInspectorView
  {
    PermitNumber: string;
    Address: string;
    GeoZone: string;
    FloodZone: string;
    Inspector: string; // assignedInspector
    Inspections: Array<ShortInspection>;
    IsPrivateProvider: boolean;
    ProcessIVData(i: Array<Inspection>): Array<InspectorView>;

  }

  export class InspectorView implements IInspectorView
  {
    public PermitNumber: string = "";
    public Address: string = "";
    public GeoZone: string = "";
    public FloodZone: string = "";
    public Inspector: string = "";
    public IsPrivateProvider: boolean = false;
    public Inspections: Array<ShortInspection> = [];

    constructor(inspection: Inspection = null)
    {
      if (inspection !== null)
      {
        this.PermitNumber = inspection.PermitNo;
        this.Address = inspection.StreetAddress;
        this.FloodZone = inspection.FloodZone;
        this.GeoZone = inspection.GeoZone;
        this.Inspector = inspection.InspectorName;
        this.IsPrivateProvider = inspection.PrivateProviderInspectionRequestId > 0;
      }

    }

    public ProcessIVData(
      inspections: Array<Inspection>,
      day: string = "",
      inspector: string = ""): Array<InspectorView>
    {
      // We're going to filter our results if a day or inspector was passed.
      let ivList: Array<InspectorView> = [];
      // if we have a day or inspector set to filter on
      // let's go ahead and filter the list of inspections
      // based on them.
      let fInspections: Array<Inspection> = inspections.filter(
        function (i)
        {
          let inspectorCheck: boolean = inspector.length > 0 ? i.InspectorName === inspector : true;
          let dayCheck: boolean = day.length > 0 ? i.Day === day : true;
          return inspectorCheck && dayCheck;
        });
      // get a unique list of permit numbers.
      let permitNumbers: Array<string> = fInspections.map(
        function (p)
        {
          return p.PermitNo;
        });
      permitNumbers = permitNumbers.filter(function (value, index, self) { return index === self.indexOf(value) });

      // let's coerce the inspection data into the IV format.
      for (let p of permitNumbers)
      {
        let i = fInspections.filter(
          function (j)
          {
            return j.PermitNo === p;
          });
        let iv = new InspectorView(i[0]); // we'll base the inspectorView off of the first inspection returned.
        iv.Inspections = i.map(function (insp)
        {
          return new ShortInspection(insp.InspReqID, insp.InspectionCode + '-' + insp.InsDesc);
        });
        ivList.push(iv);
      }
      console.log("ivList", ivList);
      return ivList;
    }

  }


}