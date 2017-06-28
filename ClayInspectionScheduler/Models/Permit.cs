using System;
using System.Collections.Generic;
using Dapper;

namespace InspectionScheduler.Models
{
  public class Permit
  {
    static bool PermitCheck { get; set; }

    // Had to make public in order to allow me to update the cancel button
    public bool IsExternalUser { get; set; }
    public string PermitNo { get; set; }
    public string ProjAddrCombined { get; set; }
    public string ProjCity { get; set; }
    public List<string> ScheduleDates
    {
      get
      {
        return Dates.GenerateShortDates( IsExternalUser);
      }
    }

    public string FailType { get; set; }

    public string CanSchedule
    {
      get
      {
        switch( FailType )
        {
          case "C":
          case "H":
          case "F":
            return "FAIL";
          //string fail = FailType;
          // return fail;
          default:
            return "PASS";
        }
      }
    }

    public Permit()
    {

    }

    public static List<Permit> Get( string AssocKey, bool IsExternalUser )
    {

      var dbArgs = new Dapper.DynamicParameters();
      dbArgs.Add( "@PermitNo", AssocKey );

      string sql = @"
      USE WATSC;
      DECLARE @MPermitNo CHAR(8) = (SELECT MPermitNo FROM bpASSOC_PERMIT WHERE PermitNo = @PermitNo);

      SELECT 
      M.PermitNo PermitNo,
          M.PermitNo MPermitNo,
          B.ProjAddrCombined,
          B.ProjCity  
      FROM bpMASTER_PERMIT M    
      LEFT OUTER JOIN bpBASE_PERMIT B ON M.BaseID = B.BaseID
      WHERE M.PermitNo = @PermitNo OR M.PermitNo = @MPermitNo
      UNION ALL
      SELECT DISTINCT 
      A.PermitNo PermitNo,
          ISNULL(A.MPermitNo, A.PermitNo) MPermitNo,
          B.ProjAddrCombined,
          B.ProjCity   
      FROM bpASSOC_PERMIT A
      LEFT OUTER JOIN bpBASE_PERMIT B ON A.BaseID = B.BaseID
      WHERE A.PermitNo = @PermitNo OR MPermitNo = @MPermitNo
    ";


      try
      {
        var lp = Constants.Get_Data<Permit>( sql, dbArgs );

        // let's set the isExternalUser field here
        foreach( Permit p in lp )
        {
          p.IsExternalUser = IsExternalUser;
        }
        return lp;
      }
      catch( Exception ex )
      {
        Constants.Log( ex );
        return null;
      }


    }

    public static List<bool> Validate(string permit, bool IsExternal) {
      List<bool> FailList = new List<bool>();
      FailList.Add(ChargesExist(permit));
      FailList.Add(HoldsExist(permit));
      if (IsExternal)
        FailList.Add(PassedFinal(permit));

      return FailList;
    }

    private static bool ChargesExist(string permit) {
      bool chargesExist = false;

      return chargesExist;
    }

    private static bool HoldsExist(string permit) {
      bool holdsExist = false;

      return holdsExist;
    }

    private static bool PassedFinal(string permit) {
      bool passedFinal = false;

      return passedFinal;
    }
  }
}