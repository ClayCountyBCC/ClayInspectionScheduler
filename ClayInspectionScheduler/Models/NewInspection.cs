﻿using System;
using System.Data.SqlClient;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Web;
using System.Data;
using Dapper;

namespace ClayInspectionScheduler.Models
{
  public class NewInspection
  {
    public string PermitNo { get; set; } = "";

    public string InspectionCd { get; set; } = "";

    public DateTime SchecDateTime { get; set; }

    public string PrivProvFieldName
    {
      get
      {
        switch (this.PermitNo[0])
        {
          case '0':
          case '1':
          case '9':
            return "PrivProvBL";
          case '2':
            return "PrivProvEL";
          case '3':
            return "PrivProvPL";
          case '4':
            return "PrivProvME";
          default:
            return "";
        }
      }
    }

    public NewInspection(string PermitNo, string InspectionCd, DateTime SchecDateTime)
    {
      this.PermitNo = PermitNo;
      this.InspectionCd = InspectionCd;
      this.SchecDateTime = SchecDateTime;
    }

    public List<string> Validate(bool IsExternalUser)
    {
      // List of things that need to be validated:
      // 0) Make sure the permit is able to be scheduled to be inspected.
      // 1) Make sure this permit is valid
      // 2) Make sure the date is in the range expected
      // 3) Make sure the inspection type matches the permit type.
      // 4) Make sure the inspection type is a valid inspection type.
      // 5) Make sure the inspection type isn't already scheduled for this permit.
      // 6) Need to ensure an Inspection cannot be saved if a final inspection result is 'A' or 'P'
      List<string> Errors = new List<string>();

      // 0)

      
      List<InspType> inspTypes = (List<InspType>)MyCache.GetItem("inspectiontypes,"+IsExternalUser.ToString());

      var Permits = (from p in Permit.Get(this.PermitNo, IsExternalUser)
                     where p.PermitNo == this.PermitNo
                     select p).ToList();


      Permit CurrentPermit;
      if (Permits.Count == 0)
      {
        Errors.Add($"Permit number {PermitNo} was not found.");

        // If permit is not found, then exit
        // no need to validate other data
        return Errors;
      }
      else
      {
        CurrentPermit = Permits.First();
        if (CurrentPermit.ErrorText != null)
        {
          Errors.Add(CurrentPermit.ErrorText);
          return Errors;
        }

        // validate user selected date

        var start = DateTime.Parse(CurrentPermit.ScheduleDates.First());
        var end = DateTime.Parse(CurrentPermit.ScheduleDates.Last());
        var badDates = (from d in CurrentPermit.ScheduleDates
                        where DateTime.Parse(d) != start &&
                        DateTime.Parse(d) != end
                        select d).ToList<string>();

        // Is the scheduled date between the start and end date?
        if (SchecDateTime.Date < start ||
          SchecDateTime.Date > end)
        {
          Errors.Add("Invalid Date Selected");
        }
        // Is the scheduled date one of the dates they aren't allowed to use?
        if (badDates.Contains(SchecDateTime.ToShortDateString()))
        {
          Errors.Add("Invalid Date Selected");
        }
        // Is the inspection type valid?
        if ((from i in inspTypes
             where i.InspCd == InspectionCd
             select i).Count() == 0)
        {
          Errors.Add("Invalid Inspection Type");
        }
        else
        {
          // Does the inspection type match the permit type
          if (InspectionCd[0] != PermitNo[0])
          {
            Errors.Add("Invalid Inspection for this permit type");
          }

          var inspections = Inspection.Get(CurrentPermit.PermitNo);
          //bool IsFinal = false;
          foreach (var i in inspections)
          {
            
            if (i.InspectionCode == this.InspectionCd && i.ResultADC == null && i.PermitNo == CurrentPermit.PermitNo)
            {
              Errors.Add("Inspection type exists on permit");
              break;
            }


            // Adds functionality to return error when saving an inspection for permit that has already passed a final inspection.
            //var types = InspType.Get(IsExternalUser);
            //foreach (var t in types)
            //{
            //  if (t.InspCd == i.InspectionCode && t.Final && (i.ResultADC == "A" || i.ResultADC == "P"))
            //  {

            //  }
            //}
          }
        }
        Console.Write(Errors);

      }
      return Errors;
    }

    public int AddIRID()
    {
      // assign string DB fieldname to variable based on permit type;
      var dbArgs = new Dapper.DynamicParameters();
      dbArgs.Add("@PermitNo", this.PermitNo);
      dbArgs.Add("@InspCd", this.InspectionCd);
      dbArgs.Add("@SelectedDate", this.SchecDateTime.Date);
      dbArgs.Add("@IRID", dbType: DbType.Int64, direction: ParameterDirection.Output);

       long? IRID = -1;

      // this function will save the inspection request.
      if (this.PrivProvFieldName.Length == 0) return -1;

      string sqlPP = $@"
        INSERT INTO bpPrivateProviderInsp (BaseId, PermitNo, InspCd, SchedDt)
        SELECT TOP 1
          B.BaseId,
          @PermitNo,
          @InspCd,
          CAST(@SelectedDate AS DATE)
        FROM bpBASE_PERMIT B
        INNER JOIN bpMASTER_PERMIT M ON B.BaseID = M.BaseID
        LEFT OUTER JOIN bpASSOC_PERMIT A ON B.BaseID = A.BaseID AND M.PermitNo = A.MPermitNo
        WHERE M.{this.PrivProvFieldName} = 1
        AND (A.PermitNo = @PermitNo OR M.PermitNo = @PermitNo)

        SET @IRID = SCOPE_IDENTITY();";
      try
      {
        var i = Constants.Exec_Query(sqlPP, dbArgs);
        if (i > -1)
        {
          IRID = dbArgs.Get<long?>( "@IRID" );
          if(IRID != null)
          {
            return (int)IRID.Value;
          }
          else
          {
            return -1;
          }
        }
        else 
        {
          return -1;

        }
        
      }
      catch (Exception ex)
      {
        Constants.Log(ex, sqlPP);
        return -1;
      }
    }

    public List<string> Save(bool IsExternalUser, string name)
    {

      List<string> errors = this.Validate(IsExternalUser);

      if (errors.Count > 0)
        return errors;

      int IRID = this.AddIRID();

      var dbArgs = new Dapper.DynamicParameters();
      dbArgs.Add("@PermitNo", this.PermitNo);
      dbArgs.Add("@InspCd", this.InspectionCd);
      dbArgs.Add("@SelectedDate", this.SchecDateTime.Date);
      dbArgs.Add("@Username", name, dbType: DbType.String, size: 7);
      dbArgs.Add("@IRID", (IRID == -1) ? null : IRID.ToString());
      dbArgs.Add("@SavedInspID",-1, dbType: DbType.AnsiString, direction: ParameterDirection.Output,size:8);

      string SavedInsp = "";

      string sql =  $@"
      USE WATSC;      
      insert into bpINS_REQUEST
          (PermitNo,
          InspectionCode,
          SchecDateTime,
          ReqDateTime,
          BaseId,
          ReceivedBy,
          PrivProvIRId)
      SELECT TOP 1
          @PermitNo,
          @InspCd,
          CAST(@SelectedDate AS DATE), 
          GetDate(),
          B.BaseId,
          @Username,
          @IRID
      FROM bpBASE_PERMIT B
      LEFT OUTER JOIN bpMASTER_PERMIT M ON M.BaseID = B.BaseID
      LEFT OUTER JOIN bpASSOC_PERMIT A ON B.BaseID = A.BaseID
      WHERE (A.PermitNo = @PermitNo OR M.PermitNo = @PermitNo)

      set @SavedInspID = LTRIM(RTRIM(CAST(SCOPE_IDENTITY() as CHAR)));
      ";
      try
      {
        var i = Constants.Exec_Query(sql, dbArgs);
        if (i > -1)
        {
          SavedInsp = dbArgs.Get<string>("@SavedInspID");
          if (SavedInsp != null && SavedInsp != "-1")
          {
            errors.Add("success");
            errors.Add(this.InspectionCd);
            errors.Add("inspection has been scheduled for permit #" + this.PermitNo + ", on " + this.SchecDateTime.ToShortDateString() + ".");
            return errors;

          }
          else
          {
            return null;
          }
        }
        else
        {
          return null;

        }

      }
      catch (Exception ex)
      {
        Constants.Log(ex, sql);
        return null;
      }
      //try
      //{
      //  int i = Constants.Execute(sql, dbArgs);
      //  if(i<1)
      //  {
      //    errors.Add("No Record Saved, Please Try again. Contact the Building department if issues persist.");
      //  }

      //  return errors;
      //}
      //catch (Exception ex)
      //{
      //  Constants.Log(ex, sql);
      //  return null;
      //}



    }


  }

}