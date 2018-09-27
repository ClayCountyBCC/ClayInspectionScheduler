using System;
using System.Data.SqlClient;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Web;
using System.Data;
using System.Runtime.Caching;
using System.Security.Policy;
using Dapper;

namespace ClayInspectionScheduler.Models
{
  public class Permit
  {
    // Had to make public in order to allow me to update the cancel button
    public UserAccess.access_type access { get; set; }
    public string PermitNo { get; set; }
    public string StreetAddress { get; set; } = "";
    public string ProjAddrCombined { get; set; }
    public string ProjCity { get; set; }
    public string ErrorText { get; set; } = "";
    public bool NoFinalInspections { get; set; } // If this is true, then cannot schedule a final inspection.
    public string Permit_URL { get; set; } = "";
    private string ContractorId { get; set; } = "";
    private int Confidential { get; set; }
    private DateTime SuspendGraceDate { get; set; } = DateTime.MinValue;
    private string Inspection_Notice { get; set; }
    private DateTime WorkersCompExpirationDate { get; set; } = DateTime.MaxValue;
    private DateTime LiabilityExpirationDate { get; set; } = DateTime.MaxValue;
    private DateTime PermitIssueDate { get; set; } = DateTime.MaxValue; // check if permt
    private decimal TotalCharges { get; set; } // check for charges
    private DateTime IssueDate { get; set; } = DateTime.MinValue;
    public int CoClosed { get; set; } // check if master is Co'd
    public int TotalFinalInspections { get; set; } // Count the total final inspections for this permit
    private string ContractorStatus { get; set; } // check if Contractor is active
    private string PrivateProvider { get; set; } = "";
    public List<Charge> Charges { get; set; } = new List<Charge>();

    public List<Hold> Holds { get; set; }
    private string PermitTypeString
    {
      get
      {
        switch (this.PermitNo[0].ToString())
        {
          case "2":
            return "EL";
          case "3":
            return "PL";
          case "4":
            return "ME";
          case "6":
            return "FR";
          default:
            return "BL";
        }
      }
    }

    public DateCache Dates
    {
      get
      {
        var dc = DateCache.getDateCache(this.access == UserAccess.access_type.public_access, this.SuspendGraceDate, this.Inspection_Notice == "180+");
        return dc;
      }
    }

    public Permit()
    {

    }

    private static List<Permit> GetRaw(string PermitNumber, bool DoImpactFeesMatter)
    {
      var dbArgs = new DynamicParameters();
      dbArgs.Add("@PermitNo", PermitNumber);
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
        ISNULL(B.ProjAddrNumber, '') +
          CASE WHEN LEN(LTRIM(RTRIM(B.ProjPreDir))) > 0 THEN LTRIM(RTRIM(B.ProjPreDir)) ELSE '' END + 
          ISNULL(B.ProjStreet, '') + 
          CASE WHEN LEN(LTRIM(RTRIM(B.ProjPostDir))) > 0 THEN LTRIM(RTRIM(B.ProjPostDir)) ELSE '' END StreetAddress,
        B.ProjAddrCombined,
        B.ProjCity,
       CAST(DATEADD(dd, 15, C.SuspendGraceDt) AS DATE) SuspendGraceDate,
        Inspection_Notice,
        B.Confidential,
        B.ContractorId,
        CAST(CASE WHEN M.CoClosed = 1 THEN 1 ELSE 0 END AS INT) CoClosed,
        DATEADD(dd,-1,C.WC_ExpDt) WorkersCompExpirationDate,
        DATEADD(dd,-1,C.LiabInsExpDt) LiabilityExpirationDate,
        ISNULL(C.Status, '') ContractorStatus,
        ISNULL(TC.TotalCharges, 0) TotalCharges,
        ISNULL(PF.TotalFinalInspections, 0) TotalFinalInspections, 

        CASE WHEN M.PrivProvBL = 1 THEN '1' ELSE '' END PrivateProvider

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
        ISNULL(B.ProjAddrNumber, '') +
          CASE WHEN LEN(LTRIM(RTRIM(B.ProjPreDir))) > 0 THEN LTRIM(RTRIM(B.ProjPreDir)) ELSE '' END + 
          ISNULL(B.ProjStreet, '') + 
          CASE WHEN LEN(LTRIM(RTRIM(B.ProjPostDir))) > 0 THEN LTRIM(RTRIM(B.ProjPostDir)) ELSE '' END StreetAddress,
        B.ProjAddrCombined,
        B.ProjCity,
       CAST(DATEADD(dd, 15, C.SuspendGraceDt) AS DATE) SuspendGraceDate,
        Inspection_Notice,
        B.Confidential,
        A.ContractorId,
        CAST(-1 AS INT) AS CoClosed,
        DATEADD(dd,-1,C.WC_ExpDt) WorkersCompExpirationDate,
        DATEADD(dd,-1,C.LiabInsExpDt) LiabilityExpirationDate,
        ISNULL(C.Status, '') ContractorStatus,
        ISNULL(TC.TotalCharges, 0) TotalCharges,
        ISNULL(PF.TotalFinalInspections, 0) TotalFinalInspections,
        '' PrivateProvider
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

      var permitlist = Constants.Get_Data<Permit>(sql, dbArgs);
      foreach(Permit p in permitlist)
      {
        p.Charges = Charge.GetCharges(p.PermitNo, DoImpactFeesMatter);
      }
      return permitlist;
    }

    public static List<Permit> Get(
      string AssocKey,
      UserAccess.access_type CurrentAccess,
      InspType newInspectionType = null,
      bool DoImpactFeesMatter = false
      )
    {
      /**
       * Need to add the following functionality to this
       * query:
       * 
       *    1. check if the permit has been issued (DateTime PermitIssueDate)
       *    2. check if holds exist
       *      a. does hold allow a pre-inspection to be scheduled? bool HoldAllowPre
       *        - Need a way to determine if get() is being called from NewInspection so
       *          hold will count against a new inspection being scheduled.\
       *        - If not called from NewInsection, AllowPreInspection holds will not generate an error
       *          to prevent a scheduling attempt.
       *        - If hold allows pre-Inspections, only pre-Inspections can be scheduled for that hold only.
       *        - If other holds exist, then those controls still apply.
       *        
       *        TODO: update UI to only include inspections eligble for scheduling.
       *      b. does hold stop final? (bool HoldStopFinal) -- This may be unecessary
       *      c. does hold stop all?  (bool HoldStopAll)
       *   
       *    3. check if there are charges (bool ChargesExist)
       *      a. does charge prevent final? bool ChargeStopFinal)
       *      b. does charge prevent all? (bool ChargeStopAll)
       *    4. Is Master Permit Co'd? (bool MasterCoClosed)
       *    
       **/
      try
      {
        var permits = GetRaw(AssocKey, DoImpactFeesMatter);
        if (permits.Any(p => p.PermitNo == AssocKey))
        {
          permits = BulkValidate(permits, newInspectionType);
          var PrivProvCheck = (from prmt in permits
                               where prmt.CoClosed != -1
                               select prmt.PrivateProvider).DefaultIfEmpty("").First();

          string host = Constants.UseProduction() ? "claybccims" : "claybccimstrn";
          foreach (Permit l in permits)
          {

            l.Permit_URL = l.PermitTypeString == "BL" ?
              $@"http://{host}/WATSWeb/Permit/MainBL.aspx?PermitNo={l.PermitNo}&Nav=PL&OperId=&PopUp=" :
              $@"http://{host}/WATSWeb/Permit/APermit{l.PermitTypeString}.aspx?PermitNo={l.PermitNo}";
            l.access = CurrentAccess;
            if (l.access == UserAccess.access_type.public_access)
            {
              l.Permit_URL = "";
              if (l.Confidential == 1)
              {
                l.ProjAddrCombined = "Confidential";
                l.ProjCity = "Confidential";
              }
            }
            if (l.ErrorText.Length == 0)
            {
              l.Validate(PrivProvCheck);
            }

          }
        }
        else
        {
          return new List<Permit>();
        }


        return permits;
      }
      catch (Exception ex)
      {
        Constants.Log(ex);
        return null;
      }
    }

    public static List<Permit> BulkValidate(
      List<Permit> permits,
      InspType newInspectionType)
    {

      var MasterPermit = (from prmt in permits
                          where prmt.CoClosed != -1
                          select prmt.PermitNo).DefaultIfEmpty("").First();

      var holds = Hold.Get((from prmt in permits
                            select prmt.PermitNo).ToList<string>());

      foreach(var h in holds)
      {
        if(h.PermitNo == null)
        {
          h.PermitNo = MasterPermit;
        }
      }
      
      var CannotInspectPermits = (from h in holds
                           where h.SatNoInspection == 1 &&
                           h.PermitNo != MasterPermit
                           select h.PermitNo).ToList();

      var ChargePermits = (from prmt in permits
                           where prmt.Charges.Count > 0
                           select prmt.PermitNo).ToList();

      var p = IsMasterClosed(permits);

      if (p.Any())
      {
        return p;
      }
      p = ChargesExist(permits, ChargePermits, MasterPermit);

      p = HoldsExist(p, holds, CannotInspectPermits, MasterPermit, newInspectionType);



      // this will only be reached if there are no bulk charge, hold, or master closed errors.
      permits = BulkContractorStatusCheck(p, MasterPermit);
      
      return p;
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

      if (closed.Any())
      {
        var Error = $@"Permit #{ closed.First().PermitNo } has been closed, no additional inspections can be scheduled for this job.";
        return BulkUpdateError(permits, Error);
      }
      return new List<Permit>();
    }

    private static List<Permit> HoldsExist(
      List<Permit> permits, 
      List<Hold> holds, 
      List<string> CannotInspectPermits, 
      string MasterPermit, 
      InspType newInspectionType = null)
    {

      if (!holds.Any() && !CannotInspectPermits.Any())
      {
        return permits;
      }
      // first let's check for any SatFinalflg holds and update the permits
      var NoFinals = (from h in holds
                      where h.SatFinalFlg == 1
                      select (h.PermitNo ?? MasterPermit)).Distinct().ToList();

      var HoldsThatAllowPreInspections = (from h in holds
                                          where h.AllowPreInspections
                                          select h.HldCd).ToList();

      var holdsAffectingMaster = (from h in holds
                                 where (h.PermitNo == null || h.PermitNo == MasterPermit)
                                 select h).ToList();


      var isBuildingFinal = newInspectionType != null &&
                            newInspectionType.Final == true &&
                            newInspectionType.InspCd[0] == 1;
      foreach (var p in permits)
      {
          p.NoFinalInspections = NoFinals.Contains(p.PermitNo);
      }

        if (!isBuildingFinal)
      {
        holdsAffectingMaster.RemoveAll(h => h.SatFinalFlg == 1);
      }

      if (newInspectionType == null || newInspectionType.PreInspection == true)
      {
        holdsAffectingMaster.RemoveAll(h => HoldsThatAllowPreInspections.Contains(h.HldCd));
      }


      // Now let's check to see if we have any master permits that have
      // any holds
      if (MasterPermit.Length > 0 && holdsAffectingMaster.Any())
      {
        var Error = $@"Permit #{ MasterPermit} has existing holds, no inspections can be scheduled. Contact
                       the building department for assistance";
        return BulkUpdateError(permits, Error);
      }

      // Do any permits have a hold where the flag SatNoInspection = 1?
      // Any permits that have a hold with this flag cannot have inspections scheduled.

      if (!CannotInspectPermits.Any()) return permits;
      {
        foreach (var p in permits)
        {
          if (p.ErrorText.Length != 0) continue;

          if (!CannotInspectPermits.Contains(p.PermitNo) && p.PermitNo != MasterPermit) continue;

          if (p.PermitNo == MasterPermit)
          {
              if(permits.Count() > 1 && holdsAffectingMaster.Any())
              { 
                p.ErrorText = "There is a hold on an associated permit, no inspections can be scheduled";
              }
          }
          else
          {

              p.ErrorText = $@"Permit #{p.PermitNo} has existing holds, no inspections can be scheduled.";
          }
        }
      }
      return permits;
    }

    private static List<Permit> ChargesExist(
      List<Permit> permits, 
      List<string> chargePermits, 
      string MasterPermit)
    {
      // Now let's check to see if we have any master permits that have
      // any holds or charges


      if (MasterPermit.Length > 0)
      {
        var masterPermit = (from p in permits
                            where p.PermitNo == MasterPermit
                            select p).FirstOrDefault();

        if (MasterPermit.Length > 0 && masterPermit.Charges.Count > 0)
        {
          var Error = $@"Permit #{masterPermit.PermitNo} has existing charges. No inspections can be scheduled.";
          return BulkUpdateError(permits, Error);
        }
      }

      // check for charges on permits...  this will prevent inspections on the associated permit and master permit only.
      // all other associated permits can schedule inspections up to and including a final

      foreach (Permit p in permits)
      {
        if (p.ErrorText.Length == 0 && p.Charges.Count > 0)
        {
          if (p.PermitNo == MasterPermit)
          {
            if (p.TotalCharges > 0)
            {
              p.ErrorText = $"There are unpaid charges on permit #{p.PermitNo}, no inspections can be scheduled";
            }
          }
          else
          {
            if (p.TotalCharges > 0)
            {
              p.ErrorText = $@"Permit #{p.PermitNo} has existing charges, no inpspections can be scheduled.";
            }
          }
        }
      }
      return permits;
    }

    private static List<Permit> BulkUpdateError(List<Permit> permits, string ErrorText)
    {
      foreach (Permit p in permits)
      {
        if (p.ErrorText.Length == 0)
          p.ErrorText = ErrorText;
      }
      return permits;
    }

    public void Validate(string PrivateProvider)
    {

      /* They cannot schedule an inspection if:
        the Contractor associated with permit --
          Anything other than A in the Status field in clContractor (S is Suspended)
          Worker's comp date is past
          Liability insurance date is past
          SuspendGraceDt + 15 days is past

        the Permit --
          Check if the Master Permit is CO'd, if yes, then no inspections can be scheduled an any associated permit
          Check if private provider is being used for the permit- User must call to schedule or request inspections for Private provider permits
          Has a charge associated with it
          Has a hold associated with it that is not ('1SWF', 'PPCC')
          Has a hold that does not hold up the final inspection?
          If the user is external and a final inspection has already been completed


            WILL NEED TO UPDATE TO INCLUDE A CHECK IF THE MASTER PERMIT HAS BEEN ISSUED
            IF NOT, BULK UPDATE ASSOC PERMITS TO DISPLAY ERROR
        As of 2/12, an inspection cannot be scheduled if the address is blank, because it hasn't been properly addressed yet.

      */
      if (this.ErrorText.Length == 0)
      {
        if (this.IssueDate == DateTime.MinValue)
        {
          this.ErrorText = $"Permit #{this.PermitNo} has not yet been issued. Please contact the building department for assistance.";
          return;
        }
        if (this.StreetAddress.Trim().Length == 0)
        {
          ErrorText = $"Permit #{this.PermitNo} does not have a valid address. Please contact the building department for assistance.";
          return;
        }

        if (PassedFinal()) return;
        if (this.access == UserAccess.access_type.public_access)
        {

          if (PrivateProvider.Length > 0)
          {
            if (CheckPrivProv(PrivateProvider)) return;
          }
          if (CheckSuspendGraceDate(this.SuspendGraceDate)) return;
        }

        if (ContractorIssues()) return;
      }
    }

    private bool CheckPrivProv(string PrivProvValidate)
    {

      if (PrivProvValidate.Contains("1"))
      {
        this.ErrorText = $"A private Provider is being used to complete inspections on this permit. Please contact the Building Department if you would like to schedule an inspection.";
        return true;
      }
      return false;
    }

    private bool CheckSuspendGraceDate(DateTime SuspendGraceDate)
    {
      if (SuspendGraceDate.ToShortDateString() == DateTime.Today.ToShortDateString() && Inspection_Notice.Trim() == "180+")
      {
        this.ErrorText = "The Grace Date for this contractor has passed. Please contact the Building Department for assistance.";
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

      if (PermitNo[0] == '6' && ContractorId == "")
      {
        ContractorId = "FIRE";
      }

      if (string.IsNullOrEmpty(this.ContractorId))
      {
        ErrorText = "There is no contractor selected on this permit. Please contact the Building Department if you would like to schedule an inspection.";
      }
      


      if (this.ContractorStatus != "A" && (this.PermitNo[0] != '6'))
      {
        // TODO: if bldg, stop all inspections, if trade, stop that permit and bldg permit inspection.
        ErrorText = "There is an issue with the contractor's status";
        return true;
      }

      // TODO: update for new contractor status checks. do not allow any permit if bldg contractor suspended, do not allow trade or bldg insection if trade contractor is suspended.
      
      else if (this.LiabilityExpirationDate <= DateTime.Today)
      {
        ErrorText = "The Contractor's Liability Insurance expiration date has passed";
        return true;
      }
      else if (this.WorkersCompExpirationDate <= DateTime.Today)
      {
        ErrorText = "The Contractor's Workman's Compensation Insurance expiration date has passed";
        return true;
      }
      // returns true if contractor issues exist for this permit.
      //"The grace period for this permit has passed."
      return false;
    }

    public static List<Permit> BulkContractorStatusCheck(List<Permit> permits, string masterPermit = "")
    {
      

      
      foreach (var permit in permits)
      {
        permit.ContractorIssues();
      }

      var suspendedContractorPermits = new List<string>();
      suspendedContractorPermits = (from permit in permits
                                    where permit.ContractorStatus != "A" &&
                                    permit.ContractorId != "OWNER" &&
                                    permit.PermitNo[0] != '6'

                                    select permit.PermitNo).ToList();

      if (suspendedContractorPermits.Count() > 0)
      {
        if (suspendedContractorPermits.Contains(masterPermit))
        {
          // TODO: add code to check if master permit. if yes, bulk update error for all
          var Error = $@"Building permit #{masterPermit} has an issue with the contractor's status, no new inspections can be scheduled.";
          BulkUpdateError(permits, Error);
        }
        else
        {
          var permitsWithBadContractors = new List<string>();
          int masterPermitIndex =-1;

          foreach (var permit in permits)
          {
            if (permit.PermitNo == masterPermit) masterPermitIndex = permits.IndexOf(permit);

            if (suspendedContractorPermits.Contains(permit.PermitNo) )
            {
              permitsWithBadContractors.Add(permit.PermitNo);
              permit.ErrorText = $@"Permit #{permit.PermitNo} has an issue with the contractors status, no new inspections can be scheduled.";
            }

            var errorString = "Permit(s) ";
            foreach(var p in permitsWithBadContractors)
            {
              errorString += p + "\n";
            }
            errorString += $" have contractor issues. No new inspections can be scheduled on these permits, and building permit {masterPermit}.";

            if(masterPermitIndex != -1)
            {
              permits[masterPermitIndex].ErrorText = errorString;
            }
          }
            
        }

      }
      return permits;
    }
   
    private bool PassedFinal()
    {
      if (this.TotalFinalInspections > 0 && this.PermitTypeString != "FR")
      {
        ErrorText = $"Permit #{this.PermitNo} has passed a final inspection";
        return true;
      }
      return false;
    }

  }

}