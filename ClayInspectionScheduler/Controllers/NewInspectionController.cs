using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using InspectionScheduler.Models;

namespace InspectionScheduler.Controllers
{
    public class NewInspectionController : ApiController
    {
      public IHttpActionResult Post( NewInspection thisInspection)
      {

      //var secInspection = new NewInspection( "19876543", "107", DateTime.Parse("04/26/2017") );


      bool lp = NewInspection.Post( thisInspection );
        if( !lp )
        {
          return InternalServerError();
        }
        else
        {
          return Ok( lp );
        }

      }
  }
}
