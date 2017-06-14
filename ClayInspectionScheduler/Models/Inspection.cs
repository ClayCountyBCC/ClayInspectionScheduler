using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data;
using System.Data.SqlClient;
using System.Configuration;
using Dapper;

namespace InspectionScheduler.Models
{
  public class Inspection
  {
    public string PermitNo { get; set; }

    public string InspReqID { get; set; }

    public string InspectionCode { get; set; }

    public string InsDesc { get; set; }

    public DateTime InspDateTime { get; set; } = DateTime.MinValue;

    public string ResultADC { get; set; }

    public string ResultDescription
    {
      get
      {
        switch(ResultADC)
        {
          case "A":
            return "Approved";
          case "C": 
            return "Canceled";
          case "D":
            return "Denied";
          case "P":
            return "Pass";
          default:
            return "";
 
        }
      }
    }

public string Remarks { get; set; } = null;

    public DateTime SchedDateTime { get; set; }

    public string Initials { get; set; } = " ";

    public string Phone { get; set; } = " ";

    public string InspectorName { get; set; } = "Unassigned";


    public string DisplayInspDateTime
    {
      get
      {
        if(this.ResultADC == "C")
          return ( InspDateTime == DateTime.MinValue ) ? "Canceled" : InspDateTime.ToShortDateString();
        
        return ( InspDateTime == DateTime.MinValue ) ? "Not Completed" : InspDateTime.ToShortDateString();

      }

    }

    public string DisplaySchedDateTime
    {
      get
      {
        return SchedDateTime == DateTime.MinValue ? "" : SchedDateTime.ToShortDateString();
      }
    }

    public Inspection()
    {


    }

    public static List<Inspection> Get( string key )
    {

      var dbArgs = new Dapper.DynamicParameters();
      dbArgs.Add( "@PermitNo", key );



      string sql = @"
        
        USE WATSC;
          select 
                 i.InspReqID,
                 i.PermitNo, 
                 i.InspectionCode, 
                 ir.InsDesc, 
                 i.InspDateTime, 
                 i.ResultADC,
                 i.SchecDateTime SchedDateTime,
                 i.Remarks,
                 i.inspector Initials,
                 ip.name InspectorName,
                 ip.PhoneNbr PhoneNumber
          from bpINS_REQUEST i
               LEFT OUTER JOIN bpINS_REF ir ON ir.InspCd = i.InspectionCode
               LEFT OUTER JOIN bp_INSPECTORS ip ON i.Inspector = ip.Intl 
          WHERE i.PermitNo = @PermitNo 
		      order by InspReqID DESC";


      try
      {
        var li = Constants.Get_Data<Inspection>( sql, dbArgs );
        return li;
      }
      catch(Exception ex)
      {
        Constants.Log( ex, sql );
        var li =  new List<Inspection>();
        li.Clear();
        return li;
      }
      
    }


    public static bool Cancel( string PermitNo, string InspID )
    {
      if( PermitNo != null && InspID != null )
      {


        var dbArgs = new Dapper.DynamicParameters();
        dbArgs.Add( "@PermitNo", PermitNo );
        dbArgs.Add( "@ID", InspID );


        string sql = @"

          USE WATSC;
        
          Update bpINS_REQUEST
          set RESULTADC = 'C'
          where PermitNo = @PermitNo AND InspReqID = @ID
            
          update bpPrivateProviderInsp
          SET Result = 'C'
          WHERE IRId = (SELECT PrivProvIRId FROM bpINS_REQUEST WHERE InspReqID = @ID);";

        try
        {

          var li = Constants.Execute( sql, dbArgs );
          return true;

        }
        catch(Exception ex)
        {
          Constants.Log(ex, sql);
          return false;
        }
      }
      else
        return false;
    }

  }
}