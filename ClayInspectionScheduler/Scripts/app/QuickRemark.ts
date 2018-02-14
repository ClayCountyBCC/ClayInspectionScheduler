namespace InspSched
{
  interface IQuickRemark
  {
    Remark: string;
    Commercial: boolean;
    Building: boolean;
    Electrical: boolean;
    Mechanical: boolean;
    Plumbing: boolean;
    PrivateProvider: boolean;
  }
  export class QuickRemark implements IQuickRemark
  {
    public Remark: string;
    public Commercial: boolean;
    public Building: boolean;
    public Electrical: boolean;
    public Mechanical: boolean;
    public Plumbing: boolean;
    public PrivateProvider: boolean;

    constructor()
    {

    }


  }
}