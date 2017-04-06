using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using InspectionScheduler.Models;


namespace InspectionScheduler.Controllers
{
  public class InspectionController : ApiController
  {
    public IHttpActionResult Get( string id )
    {
      List<Inspection> lp = Inspection.Get ( id );
      if ( lp == null )
      {
        return InternalServerError ( );
      }
      else
      {
        return Ok ( lp );
      }
    }
    public IHttpActionResult Delete( string id , string InspId)
    {
      
      bool lp = Inspection.Delete ( id  ,InspId);
      if (!lp )
      {
        return InternalServerError ( );
      }
      else
      {
        return Ok ( lp );
      }

    }

  }


}
