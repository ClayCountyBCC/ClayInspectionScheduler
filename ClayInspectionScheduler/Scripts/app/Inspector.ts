namespace InspSched
{
  interface IInspector
  {
    Name: string;
    Color: string;
    CommercialPermit: boolean;
    BuildingPermit: boolean;
    ElectricalPermit: boolean;
    MechanicalPermit: boolean;
    PlumbingPermit: boolean;
    PrivateProvider: boolean;
    Initials: string;
    in_development: boolean;
  }
  export class Inspector implements IInspector
  {
    public Name: string;
    public Color: string;
    public CommercialPermit: boolean;
    public BuildingPermit: boolean;
    public ElectricalPermit: boolean;
    public MechanicalPermit: boolean;
    public PlumbingPermit: boolean;
    public PrivateProvider: boolean;
    public Initials: string;
    public in_development: boolean; 
 

    constructor()
    {

    }


  }
}