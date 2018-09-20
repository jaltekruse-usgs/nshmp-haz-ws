package gov.usgs.earthquake.nshmp.www;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Custom NSHMP servlet implementation.
 * 
 * <p>All nshmp-haz-ws services should extend this class. This class sets custom
 * response headers and provides access to updated host,
 * {@code request.getServerName()} and protocol, {@code request.getScheme()},
 * values to support (possible forwarded) requests on USGS servers. To construct
 * the correct request URLs use the host() and protocol() methods as in the
 * example below:
 * 
 * <pre>
 * response.getWriter().printf("%s://%s/service-name/...", protocol(), host());
 * </pre>
 * 
 * @author Peter Powers
 */
abstract class NshmpServlet extends HttpServlet {

  @Override
  protected void service(
      HttpServletRequest request,
      HttpServletResponse response)
      throws ServletException, IOException {

    /*
     * Set CORS headers and content type.
     * 
     * Because nshmp-haz-ws services may be called by both the USGS website,
     * other websites, and directly by 3rd party applications, reponses
     * generated by direct requests will not have the necessary header
     * information that would be required by security protocols for web
     * requests. This means that any initial direct request will pollute
     * intermediate caches with a response that a browser will deem invalid.
     */
    response.setContentType("application/json; charset=UTF-8");
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "*");
    response.setHeader("Access-Control-Allow-Headers", "accept,origin,authorization,content-type");

    super.service(request, response);
  }

  String host() {
    return null;
  }

  String protocol() {
    return null;
  }
}
