/// <reference path="shortinspection.ts" />

namespace InspSched
{
  interface IInspectionViewByAddress
  {
    Address: string;
    GeoZone: string;
    FloodZone: string;
    Inspector: string; // assignedInspector
    Inspections: Array<ShortInspection>;
    IsPrivateProvider: boolean;
    IsCommercial: boolean;
  }

  export class InspectionViewByAddress implements IInspectionViewByAddress
  {    
    public Address: string = "";
    public GeoZone: string = "";
    public FloodZone: string = "";
    public Inspector: string = "";
    public IsPrivateProvider: boolean = false;
    public IsCommercial: boolean = false;
    public Inspections: Array<ShortInspection> = [];

    constructor(inspection: Inspection = null)
    {
      if (inspection !== null)
      {
        this.Address = inspection.StreetAddress;
        this.FloodZone = inspection.FloodZone;
        this.GeoZone = inspection.GeoZone;
        this.Inspector = inspection.InspectorName;
        this.IsPrivateProvider = inspection.PrivateProviderInspectionRequestId > 0;
        this.IsCommercial = inspection.IsCommercial;
      }
    }

  }


}