using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Web.Http;
using System.Web;

namespace InspectionScheduler.Models
{
  public class Contractor
  {

    public string ContractorId { get; }
    
    public DateTime SuspendGraceDt { get; }

    public Contractor()
    {


    }

    public static List<Contractor> Get( string PermitNo )
    {
      var testNum = new double ( );
      bool myBool = false;
      int newNum = -1;
      testNum = 0.0;

      var dbArgs = new Dapper.DynamicParameters ( );
      dbArgs.Add ( "@PermitNo", PermitNo );
      dbArgs.Add ( "@MyBool", myBool );
      dbArgs.Add ( "@MyNum", newNum );

      if ( PermitNo.Length == 8 && double.TryParse ( PermitNo, out testNum ) )
      {
        string sql = @"
          USE WATSC;

          SELECT contractorCd,
              contractorCd
          FROM clContractor clc
          WHERE ContractorCd = 
          (
            SELECT contractorID 
            FROM bpASSOC_PERMIT
            WHERE PermitNo = @PermitNo
            UNION ALL
            SELECT b.ContractorID 
            FROM bpMASTER_PERMIT m
            JOIN bpBASE_PERMIT b 
            ON m.BaseID = b.BaseID
            WHERE m.PermitNo = @PermitNo
          )
          AND Status = 'A'

          --Uncomment next two lines for testing
          --AND clc.LiabInsExpDt > '01/01/2015'
          --AND clc.WC_ExpDt > '01/01/2015'

          --Comment next two lines for testing
          AND clc.LiabInsExpDt > SYSUTCDATETIME()
          AND clc.WC_ExpDt > SYSUTCDATETIME()

          GROUP BY ContractorCd";


        var li = Constants.Get_Data<Contractor> ( sql, dbArgs );
        return li; 

      }
      else
      {

        string sql = @"";
        var li = Constants.Get_Data<Contractor> ( sql, dbArgs );
        return li;

      }
    }
  }
}