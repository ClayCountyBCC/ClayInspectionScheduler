using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using InspectionScheduler.Models;

namespace InspectionScheduler.Controllers
{
  public class NewInspectionController :ApiController
  {
    public IHttpActionResult Save( NewInspection thisInspection )
    {

      var e = thisInspection.Save( Constants.CheckIsExternalUser() );
      if( e == null )
      {
        return InternalServerError();  // Option to code my own error
      }
      else
      {
        return Ok( e );
      }
    }
  }
}
