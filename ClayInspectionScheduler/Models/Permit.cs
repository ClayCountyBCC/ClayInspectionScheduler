using System;
using System.Collections.Generic;
using Dapper;

namespace ClayInspectionScheduler.Models
{
  public class Permit
  {
    static bool PermitCheck { get; set; }

    // Had to make public in order to allow me to update the cancel button
    public bool IsExternalUser { get; set; }
    public string PermitNo { get; set; }
    public string ProjAddrCombined { get; set; }
    public string ProjCity { get; set; }
    public int Confidential { get; set; }

    private DateTime SuspendGraceDate { get; set; } = DateTime.MinValue;
    private DateTime WorkersCompExpirationDate { get; set; }
    private DateTime LiabilityExpirationDate { get; set; }
    private string ContractorStatus { get; set; }

    public List<string> ScheduleDates
    {
      get
      {
        return InspectionDates.GenerateShortDates(IsExternalUser, SuspendGraceDate);
      }
    }

    public Permit()
    {

    }

    public static List<Permit> Get(string AssocKey, bool IsExternalUser)
    {

      var dbArgs = new DynamicParameters();
      dbArgs.Add("@PermitNo", AssocKey);

      string sql = @"
      USE WATSC;
      DECLARE @MPermitNo CHAR(8) = (SELECT MPermitNo FROM bpASSOC_PERMIT WHERE PermitNo = @PermitNo);

      SELECT 
        M.PermitNo PermitNo,
        M.PermitNo MPermitNo,
        B.ProjAddrCombined,
        B.ProjCity,
        CAST(DATEADD(dd, 15, C.SuspendGraceDt) AS DATE) SuspendGraceDate,
        B.Confidential,
        C.WC_ExpDt WorkersCompExpirationDate,
        C.LiabInsExpDt LiabilityExpirationDate,
        C.Status ContractorStatus
      FROM bpMASTER_PERMIT M    
      LEFT OUTER JOIN bpBASE_PERMIT B ON M.BaseID = B.BaseID
      LEFT OUTER JOIN clContractor C ON B.ContractorId = C.ContractorCd
      WHERE 
        (M.PermitNo = @PermitNo OR M.PermitNo = @MPermitNo)
        AND M.VoidDate IS NULL

      UNION ALL

      SELECT DISTINCT 
        A.PermitNo PermitNo,
        ISNULL(A.MPermitNo, A.PermitNo) MPermitNo,
        B.ProjAddrCombined,
        B.ProjCity,
        CAST(DATEADD(dd, 15, C.SuspendGraceDt) AS DATE) SuspendGraceDt,
        B.Confidential,
        C.WC_ExpDt WorkersCompExpirationDate,
        C.LiabInsExpDt LiabilityExpirationDate,
        C.Status ContractorStatus
      FROM bpASSOC_PERMIT A
      LEFT OUTER JOIN bpBASE_PERMIT B ON A.BaseID = B.BaseID
      LEFT OUTER JOIN clContractor C ON A.ContractorId = C.ContractorCd
      WHERE 
        (A.PermitNo = @PermitNo OR MPermitNo = @MPermitNo)
        AND A.VoidDate IS NULL
    ";
      try
      {
        var lp =  Constants.Get_Data<Permit>(sql, dbArgs);
        foreach (Permit l in lp)
        {
          l.IsExternalUser = IsExternalUser;
          if(l.Confidential == 1 && IsExternalUser)
          {
            l.ProjAddrCombined = "Confidential";
            l.ProjCity = "Confidential";
          }
        }
        return lp;
      }
      catch (Exception ex)
      {
        Constants.Log(ex);
        return null;
      }


    }

    public static string Validate(string permitNo, bool IsExternal)
    {
      /*
      They cannot schedule an inspection if:
        the Contractor associated with permit --
          Anything other than A in the Status field in clContractor (S is Suspended)
          Worker's comp date is past
          Liability insurance date is past
          SuspendGraceDt + 15 days is past
        
        the Permit --
          Has a charge associated with it
          Has a hold associated with it that is not ('1SWF', 'PPCC')
          Has a hold that does not hold up the final inspection?
          If the user is external and a final inspection has already been completed
      */
      string s = ChargesExist(permitNo);
      if (s.Length > 0) return s;

      s = ContractorIssues(permitNo);
      if (s.Length > 0) return s;

      s = HoldsExist(permitNo);
      if (s.Length > 0) return s;



      if (IsExternal)
      {
        s = PassedFinal(permitNo);
        return s;
      }
      return "";
    }

    private static string ContractorIssues(string permitNo)
    {
      //"The grace period for this permit has passed."
      return "";
    }

    private static string ChargesExist(string permitNo)
    {
      string sql = @"


";
      return sql;
    }

    private static string HoldsExist(string permitNo)
    {
      //bool holdsExist = false;

      return "";
    }

    private static string PassedFinal(string permitNo)
    {
      //bool passedFinal = false;

      return "";
    }
  }
}