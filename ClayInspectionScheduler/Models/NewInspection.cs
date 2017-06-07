using System;
using System.Data.SqlClient;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Web;



namespace InspectionScheduler.Models
{
  public class NewInspection
  {
    public string PermitNo { get; set; } = "";

    public string InspectionCd { get; set; } = "";

    public DateTime SchecDateTime { get; set; }

    public NewInspection( string PermitNo, string InspectionCd, DateTime SchecDateTime )
    {
      this.PermitNo = PermitNo;
      this.InspectionCd = InspectionCd;
      this.SchecDateTime = SchecDateTime;
    }

    public List<string> Validate( bool IsExternalUser )
    {
      // List of things that need to be validated:
      // 1) Make sure this permit is valid
      // 2) Make sure the date is in the range expected
      // 3) Make sure the inspection type matches the permit type.
      // 4) Make sure the inspection type is a valid inspection type.
      // 5) Make sure the inspection type isn't already scheduled for this permit.

      List<string> Errors = new List<string>();
      List<InspType> inspTypes = ( List<InspType> )MyCache.GetItem( "inspectiontypes" );

      var Permits = ( from p in Permit.Get( this.PermitNo, IsExternalUser )
                      where p.PermitNo == this.PermitNo
                      select p ).ToList();

      Permit CurrentPermit;
      if( Permits.Count == 0 )
      {
        Errors.Add( "Permit number \"" + PermitNo + "\" was not found." );

        // If permit is not found, then exit
        // no need to validate other data
        return Errors;
      }
      else
      {
        CurrentPermit = Permits.First();

        // validate user selected date

        var start = DateTime.Parse( CurrentPermit.ScheduleDates.First() );
        var end = DateTime.Parse( CurrentPermit.ScheduleDates.Last() );
        var badDates = ( from d in CurrentPermit.ScheduleDates
                         where DateTime.Parse( d ) != start &&
                         DateTime.Parse( d ) != end
                         select d ).ToList<string>();

        // Is the scheduled date between the start and end date?
        if( SchecDateTime.Date < start ||
          SchecDateTime.Date > end )
        {
          Errors.Add( "Invalid Date Selected" );
        }
        // Is the scheduled date one of the dates they aren't allowed to use?
        if( badDates.Contains( SchecDateTime.ToShortDateString() ) )
        {
          Errors.Add( "Invalid Date Selected" );
        }
        // Is the inspection type valid?
        if( ( from i in inspTypes
              where i.InspCd == InspectionCd
              select i ).Count() == 0 )
        {
          Errors.Add( "Invalid Inspection Type" );
        }
        else
        {
          // Does the inspection type match the permit type
          if( InspectionCd[ 0 ] != PermitNo[ 0 ] )
          {
            Errors.Add( "Invalid Inspection for this permit type" );
          }

          // TODO: Need to code check inspection type exists on permit
          var e = Inspection.Get( CurrentPermit.PermitNo );
          foreach( var i in e )
          {
            if( i.InspectionCode == this.InspectionCd )
            {
              Errors.Add( "Inspection type exists on permit" );
              break;
            }
          }
        }
        Errors.Add( "Inspection type exists on permit" );
        Console.Write( Errors );

      }


      return Errors;
      
    }




    public List<string> Save( bool IsExternalUser )
    {
      
      List<string> e = this.Validate( Constants.CheckIsExternalUser() );

      if( e.Count > 0 )
        return e;


      // assign string DB fieldname to variable based on permit type;
      string PrivProvFieldName = "" ;
      ;
        var dbArgs = new Dapper.DynamicParameters();
        dbArgs.Add( "@PermitNo", this.PermitNo );
        dbArgs.Add( "@InspCd", this.InspectionCd );
        dbArgs.Add( "@SelectedDate", this.SchecDateTime.Date );

        if(this.PermitNo != null || this.PermitNo != "")
        { 
        switch(this.PermitNo[0])
        {
        case '0':
        case '1':
        case '9':
          PrivProvFieldName = "PrivProvBL";
          break;
        case '2':
          PrivProvFieldName = "PrivProvEL";
          break;
        case '3':
          PrivProvFieldName = "PrivProvPL";
          break;
        case '4':
          PrivProvFieldName = "PrivProvME";
          break;

        }
      }
      // this function will save the inspection request.
      string sql =
      @"
      USE WATSC

      DECLARE @MPermitNo CHAR(8) = (SELECT MPermitNo FROM bpASSOC_PERMIT WHERE PermitNo = @PermitNo);
      DECLARE @BaseId int = (select distinct BaseId from bpMasterPermit 
                                         where PermitNo = @MPermitNo)

      insert into bpINS_REQUEST
         (PermitNo,
             InspectionCode,
             SchecDateTime,
             BaseId)
             Values
         (@PermitNo,
             @InspCd,
             CAST(@SelectedDate AS DATE),
             @BaseId)

      IF (SELECT " + PrivProvFieldName + " FROM bpMASTER_PERMIT WHERE BASEID = @BaseId )= 1 " +
      "BEGIN " +
             "Declare @RETURN int " +
             "execute @RETURN = dbo.prc_ins_irPPSched "+
                                                        " @IRIDReturn OUTPUT " +
                                                        ", @PermitNo "+
                                                        ", @InspCd " +
                                                        ", @BaseId "+
                                                        ", @SelectedDate "+
             "UPDATE bpINS_REQUEST " + 
             "set PrivProvIRId = @RETURN " +
             "where PermitNo = @PermitNo and " +
                      "InspectionCode = @InspCd and "+
                      "SchecDateTime = @SelectedDate " +

      " END";


      /*****************************************

      USE WATSC

      DECLARE @MPermitNo CHAR(8) = (SELECT MPermitNo FROM bpASSOC_PERMIT WHERE PermitNo = @PermitNo);
      DECLARE @BaseId int = (select distinct BaseId from bpMasterPermit 
                                         where PermitNo = @MPermitNo)

      insert into bpINS_REQUEST
         (PermitNo,
             InspectionCode,
             SchecDateTime,
             BaseId)
             Values
         (@PermitNo,
             @InspCd,
             CAST(@SelectedDate AS DATE),
             @BaseId)

      IF (SELECT " + PrivProvFieldName + " FROM bpMASTER_PERMIT WHERE BASEID = @BaseId )= 1
      BEGIN
             Declare @RETURN int
             execute @RETURN  =  dbo.prc_ins_irPPSched
                                    @IRIDReturn OUTPUT
                                    ,@PermitNo
                                    ,@InspCd
                                    ,@BaseId
                                    ,@SelectedDate
             UPDATE bpINS_REQUEST
             set PrivProvIRId = @RETURN
             where PermitNo = @PermitNo and 
                      InspectionCode = @InspCd and 
                      SchecDateTime = @SelectedDate

      END;

       * *************************************/


      try
      {
        Constants.Save_Data<string>( sql, dbArgs );

        return e;
      }catch(Exception ex)
      {
        Constants.Log( ex , sql);
        return null;
      }


      
    }


  }

}