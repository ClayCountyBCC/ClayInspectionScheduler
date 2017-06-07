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

    public DateTime InspDateTime { get; set; }

    public string ResultADC { get; set; }

    public string Remarks { get; set; } = null;

    public DateTime SchedDateTime { get; set; }

    public string Initials { get; set; } = " ";

    public string Phone { get; set; } = " ";

    public string InspectorName { get; set; } = "Unassigned";
    

    public string DisplayInspDateTime
    {
      get
      {
        return InspDateTime == DateTime.MaxValue || DateTime.Parse(InspDateTime.ToShortDateString()) == DateTime.Parse("01/01/0001") ? "" : InspDateTime.ToShortDateString ( );
      }
    }

    public string DisplaySchedDateTime
    {
      get
      {
        return SchedDateTime == DateTime.MinValue ? "" : SchedDateTime.ToShortDateString ( );
      }
    }
    
    public Inspection()
    {


    }

    public static List<Inspection> Get( string key )
    {
      var testNum = new double ( );
      testNum = 0.0;

      var dbArgs = new Dapper.DynamicParameters ( );
      dbArgs.Add ( "@PermitNo", key );

      if ( key.Length == 8 && double.TryParse ( key, out testNum ) )
      {
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
          order by i.InspDateTime DESC, i.ResultADC DESC, i.SchecDateTime ASC";

        var li = Constants.Get_Data<Inspection> ( sql, dbArgs );
        return li;

      }
      else
      {
        string sql = @"";

        var li = Constants.Get_Data<Inspection> ( sql, dbArgs );
        return li;
      }

    }
    
    public static bool Delete( string PermitNo, string InspID )
    {
      if( PermitNo != null && InspID != null )
      {
        var testNum = new double();
        testNum = 0.0;

        var dbArgs = new Dapper.DynamicParameters();
        dbArgs.Add( "@PermitNo", PermitNo );
        dbArgs.Add( "@ID", InspID );

        if( PermitNo.Length == 8 && InspID.Length > 0 && double.TryParse( PermitNo, out testNum ) && double.TryParse( InspID, out testNum ) )
        {
          string sql = @"

            USE WATSC;
        
            delete bpINS_REQUEST
            where PermitNo = @PermitNo AND InspReqID = @ID;";

          var li = Constants.Execute<Inspection>( sql, dbArgs );
          return true;

        }
        else
        {
          string sql = @"";

          var li = Constants.Execute<Inspection>( sql, dbArgs );
          return false;
        }
      }
      else
        return false;
    }

  }



}