using System;
using System.Data.SqlClient;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Web;
using System.Data;
using Dapper;


namespace ClayInspectionScheduler.Models
{
  public class Permit
  {
    // Had to make public in order to allow me to update the cancel button
    public bool IsExternalUser { get; set; }
    public string PermitNo { get; set; }
    public string ProjAddrCombined { get; set; }
    public string ProjCity { get; set; }
    public string ErrorText { get; set; } = "";
    public bool NoFinalInspections { get; set; } // If this is true, they can't schedule a final inspection on the client.

    private string ContractorId { get; set; }
    private int Confidential { get; set; }
    private DateTime SuspendGraceDate { get; set; } = DateTime.MinValue;
    private DateTime WorkersCompExpirationDate { get; set; } = DateTime.MaxValue;
    private DateTime LiabilityExpirationDate { get; set; } = DateTime.MaxValue;
    private DateTime PermitIssueDate { get; set; } = DateTime.MaxValue; // check if permt
    private decimal TotalCharges { get; set; } // check for charges
    private DateTime IssueDate { get; set; } = DateTime.MinValue;
    private int CoClosed { get; set; } // check if master is Co'd
    private int TotalFinalInspections { get; set; } // Count the total final inspections for this permit
    private string ContractorStatus { get; set; } // check if Contractor is active
    
    private List<Hold> Holds { get; set; }
    

    public List<string> ScheduleDates
    {
      get
      {
        return InspectionDates.GenerateShortDates(IsExternalUser, (ContractorStatus == "A"? DateTime.MinValue : SuspendGraceDate));
      }
    }
   
    public Permit()
    {

    }

    public static List<Permit> Get(string AssocKey, bool IsExternalUser)
    {
      /**
       * Need to add the following functionality to this
       * query:
       * 
       *    1. check if the permit has been issued (DateTime PermitIssueDate)
       *    2. check if holds exist
       *      a. does hold stop final? (bool HoldStopAll) -- This may be unecessary
       *      b. does hold stop all?  (bool HoldStopFinal)
       *    3. check if there are charges (bool ChargesExist)
       *    4. Is Master Permit Co'd? (bool MasterCoClosed)
       *    
       **/
      var dbArgs = new DynamicParameters();
      dbArgs.Add("@PermitNo", AssocKey);
      string sql = @"
      USE WATSC;
      DECLARE @MPermitNo CHAR(8) = (SELECT MPermitNo FROM bpASSOC_PERMIT WHERE PermitNo = @PermitNo);
      
      WITH TotalCharges(PermitNo, TotalCharges) AS (
        Select 
          AssocKey PermitNo,
          SUM(Total) AS TotalCharges
        FROM ccCashierItem 
        WHERE 
          AssocKey IS NOT NULL 
          AND Total > 0			    -- CHECKS IF TOTAL (owed) IS GREATER THAN ZERO
          AND CashierId IS NULL	-- CHECK IF CASHIER HAS SIGNED OFF ON CHARGE (IF NULL, THEN CHARGE IS STILL VALID)
          AND UnCollectable = 0
        GROUP BY AssocKey
      ), PassedFinal (PermitNo, TotalFinalInspections) AS (
        SELECT 
          PermitNo,
          COUNT(InspReqID) AS TotalFinalInspections
        FROM bpINS_REQUEST I
        INNER JOIN bpINS_REF IR ON I.InspectionCode = IR.InspCd AND Final = 1
        WHERE ResultADC IN ('A', 'P')
        GROUP BY I.PermitNo
      )
      
      SELECT 
        distinct M.PermitNo PermitNo,
        M.PermitNo MPermitNo,
        M.IssueDate,
        B.ProjAddrCombined,
        B.ProjCity,
        CAST(DATEADD(dd, 15, C.SuspendGraceDt) AS DATE) SuspendGraceDate,
        B.Confidential,
        B.ContractorId,
        CAST(CASE WHEN M.CoClosed = 1 THEN 1 ELSE 0 END AS INT) CoClosed,
        C.WC_ExpDt WorkersCompExpirationDate,
        C.LiabInsExpDt LiabilityExpirationDate,
        ISNULL(C.Status, '') ContractorStatus,
        ISNULL(TC.TotalCharges, 0) TotalCharges,
        ISNULL(PF.TotalFinalInspections, 0) TotalFinalInspections
      FROM bpMASTER_PERMIT M
      LEFT OUTER JOIN bpBASE_PERMIT B ON M.BaseID = B.BaseID
      LEFT OUTER JOIN clContractor C ON B.ContractorId = C.ContractorCd 
		  LEFT OUTER JOIN TotalCharges TC ON M.PermitNo = TC.PermitNo
      LEFT OUTER JOIN PassedFinal PF ON M.PermitNo = PF.PermitNo 
		  WHERE 
        (M.PermitNo = @MPermitNo 
		      OR M.PermitNo = @PermitNo)
		    AND M.VoidDate is NULL

      UNION ALL

      SELECT 
        distinct A.PermitNo PermitNo,
        ISNULL(A.MPermitNo, '') MPermitNo,
        A.IssueDate,
        B.ProjAddrCombined,
        B.ProjCity,
        CAST(DATEADD(dd, 15, C.SuspendGraceDt) AS DATE) SuspendGraceDate,
        B.Confidential,
        A.ContractorId,
        CAST(-1 AS INT) AS CoClosed,
        C.WC_ExpDt WorkersCompExpirationDate,
        C.LiabInsExpDt LiabilityExpirationDate,
        ISNULL(C.Status, '') ContractorStatus,
        ISNULL(TC.TotalCharges, 0) TotalCharges,
        ISNULL(PF.TotalFinalInspections, 0) TotalFinalInspections
      FROM 
        bpASSOC_PERMIT A
      LEFT OUTER JOIN bpBASE_PERMIT B ON A.BaseID = B.BaseID
      LEFT OUTER JOIN clContractor C ON A.ContractorId = C.ContractorCd 
      LEFT OUTER JOIN TotalCharges TC ON A.PermitNo = TC.PermitNo
      LEFT OUTER JOIN PassedFinal PF ON A.PermitNo = PF.PermitNo 
		  WHERE
        (A.PermitNo = @PermitNo 
		        OR MPermitNo = @MPermitNo
		        OR A.mPermitNo = @PermitNo)
   		    AND A.VoidDate IS NULL";
      try
      {
        var permits = Constants.Get_Data<Permit>(sql, dbArgs);
        permits = BulkValidate(permits);
        foreach (Permit l in permits)
        {
          l.IsExternalUser = IsExternalUser;
          if (l.Confidential == 1 && IsExternalUser)
          {
            l.ProjAddrCombined = "Confidential";
            l.ProjCity = "Confidential";
          }
          if (l.ErrorText.Length == 0) l.Validate();
        }

        return permits;
      }
      catch (Exception ex)
      {
        Constants.Log(ex);
        return null;
      }
    }

    public static List<Permit> BulkValidate(List<Permit> permits)
    {
      var p = IsMasterClosed(permits);
      if (p.Count() > 0) return p;
      p = HoldsExist(permits);
      if (p.Count() > 0) return p;
      return permits;
    }

    public static List<Permit> IsMasterClosed(List<Permit> permits)
    {
      // This function needs to:
      // 1) Verify if the Master permit has been Co'd
      // 2) If this is an Associated permit that has a master permit, 
      //    it needs to verify if the master permit is Co'd.
      // 3) If an associated permit has NO master permit, 
      //    we need to check if it has a passed non-partial final inspection.

      var closed = (from p in permits
                    where p.CoClosed == 1
                    select p);

      if(closed.Count() > 0)
      {
        var Error = $@"Permit #{ closed.First().PermitNo } has passed the final inspection, no additional inspections can be scheduled for this job";
        return BulkUpdateError(permits, Error);
      }
      return new List<Permit>();
    }

    public static List<Permit> HoldsExist(List<Permit> permits)
    {
      var holds = Hold.Get((from p in permits
                            select p.PermitNo).ToList<string>());

      // first let's check for any SatFinalflg holds and update the permits
      var NoFinals = (from h in holds
                      where h.SatFinalFlag == 1
                      select h.PermitNo).ToList();

      foreach (Permit p in permits)
      {
        p.NoFinalInspections = NoFinals.Contains(p.PermitNo);
      }

      // Now let's check to see if we have any master permits that have
      // any hold
      var MasterPermits = (from p in permits
                           where p.CoClosed != -1
                           select p).ToList();

      if(MasterPermits.Count() > 0)
      {
       if((from h in holds
          where h.PermitNo == MasterPermits.First().PermitNo
          select h).Count() > 0)
        {
          var Error = $@"Permit #{ MasterPermits.First().PermitNo } has a hold, no inspections can be scheduled.";
          return BulkUpdateError(permits, Error);
        }
      }
      // Do any permits have a hold where the flag SatNoInspection = 1?
      // Any permits that have a hold with this flag cannot have inspections scheduled.
      var NoInspections = (from h in holds
                           where h.SatNoInspection == 1
                           select h.PermitNo).ToList();
      foreach (Permit p in permits)
      {
        if (NoInspections.Contains(p.PermitNo))
        {
          p.ErrorText =  $@"Permit #{ p.PermitNo } has a hold, no inspections can be scheduled.";
        }
      }

      return permits;
    }

    private static List<Permit> BulkUpdateError(List<Permit> permits, string ErrorText)
    {
      foreach (Permit p in permits)
      {
        p.ErrorText = ErrorText;
      }
      return permits;
    }

    public void Validate()
    {
      /*
      They cannot schedule an inspection if:
        the Contractor associated with permit --
          Anything other than A in the Status field in clContractor (S is Suspended)
          Worker's comp date is past
          Liability insurance date is past
          SuspendGraceDt + 15 days is past

        the Permit --
          Check if the Master Permit is CO'd, if yes, then no inspections can be scheduled an any associated permit
          Has a charge associated with it
          Has a hold associated with it that is not ('1SWF', 'PPCC')
          Has a hold that does not hold up the final inspection?
          If the user is external and a final inspection has already been completed
      */
      if (PermitIsNotIssued()) return;

      if (this.IsExternalUser)
      {
        if (PassedFinal()) return;
      }

      if (ChargesExist()) return;

      if (ContractorIssues()) return;
      
    }

    private bool PermitIsNotIssued()
    {
      if (this.IssueDate == DateTime.MinValue)
      {
        ErrorText = $@"Permit #{this.PermitNo} has not yet been issued. Please contact the building department for assistance";
        return true;
      }
      return false;
      //try
      //{
      //  var dp = new DynamicParameters();
      //  dp.Add("@PermitNo", this.PermitNo);

      //  string sql = $@"
      //  use watsc;
      //  DECLARE @MPermitNo CHAR(8) = (SELECT MPermitNo FROM bpASSOC_PERMIT WHERE PermitNo = @PermitNo);

      //  SELECT COUNT(*) AS CNT FROM (
      //  select PermitNo, CAST(IssueDate AS DATE) AS IssueDate from bpASSOC_PERMIT A 
      //  WHERE IssueDate IS NULL AND PermitNo = @PermitNo
      //  UNION
      //  SELECT PermitNo, CAST(IssueDate AS DATE) AS IssueDate FROM bpMASTER_PERMIT M
      //  WHERE PermitNo = @MPermitNo OR PermitNo = @PermitNo) AS tmp 
      //  WHERE IssueDate IS NULL AND PERMITNO = @PermitNo

      //  ";

      //  var i = Constants.Execute_Scalar<int>(sql, dp);

      //  switch (i)
      //  {
      //    case -1:
      //      ErrorText = $@"There was an issue checking
      //                  issue data information 
      //                  for Permit # {this.PermitNo}";

      //      return true;
      //    case 0:
      //      return false;
      //    default:
      //      ErrorText = $@"Permit #{this.PermitNo} has 
      //                  not yet been issued. Please contact 
      //                  the building department for assistance";
      //      return true;
      //  }
      //}
      //catch (Exception ex)
      //{
      //  Constants.Log(ex);
      //  ErrorText = $"There was an issue getting data for Permit #{this.PermitNo}";
      //  return true;
      //}

    }
    
    private bool ChargesExist()
    {
      // returns true if charges exist for this permit or there is an issue getting this data for the permit.
      if(this.TotalCharges > 0)
      {
        ErrorText = $"There are unpaid charges associated with Permit #{this.PermitNo}";
        return true;
      }
      return false;
    }

    private bool ContractorIssues()
    {
      // Contractor Owners do not have any valid data for these fields
      if (this.ContractorId.ToUpper() == "OWNER") 
      {
        return false;
      } 
      
      if (this.LiabilityExpirationDate <= DateTime.Today)
      {
        ErrorText = "The Contractor's Liability Insurance expiration date has passed";
        return true;
      }
      else if (this.WorkersCompExpirationDate <= DateTime.Today)
      {
        ErrorText = "The Contractor's Workman's Compensation Insurance expiration date has passed";
        return true;
      }
      else if (this.ContractorStatus != "A")
      {
        ErrorText = "There is an issue with the contractor's status";
        return true;
      }
      // returns true if contractor issues exist for this permit.
      //"The grace period for this permit has passed."
      return false;
    }

    private bool PassedFinal()
    {
      if(this.TotalFinalInspections > 0)
      {
        ErrorText = $"Permit #{this.PermitNo} has passed a final inspection";
        return true;
      }
      return false;
    }

  }
}