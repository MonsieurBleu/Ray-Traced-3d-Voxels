#include <iostream>
#include <App.hpp>
#include <tgmath.h>

#define PI 3.14159265358979323846

void Camera::update_direction()
{
    if(mouse_follow)
    {
        int width, height;
        glfwGetWindowSize(*window, &width, &height);

        glfwGetCursorPos(*window, &Mouse_uv.x, &Mouse_uv.y);

        float th = Mouse_uv.z*Mouse_uv.y*PI*(1.0/height); // polar theta of direction
        float ph = Mouse_uv.z*Mouse_uv.x*PI*(1.0/width); // polar phi of direction

        vec3<float> newdir(sin(th)*cos(ph), cos(th), sin(th)*sin(ph));
        direction = newdir;

        polar_direction[0] = th;
        polar_direction[1] = ph;

        // std::cout << direction << "\n";
    }
}

void Camera::move(vec3<float> velocity)
{
    float velmult = (Get_time_ms()-time_since_last_movement)*0.001f;

	float thV, phV;
	if(polar_direction[0] < 0.5*PI) {
		thV = 0.5*PI - polar_direction[0];
		phV = fmod(polar_direction[1] + PI, 2.0*PI);
	} else {
		thV = polar_direction[0] - 0.5*PI;
		phV = polar_direction[1];
	}
	vec3<float> v(sin(thV)*cos(phV), cos(thV), sin(thV)*sin(phV));

    position = position + direction * velocity.x * velmult 
                        + cross(v, direction) * velocity.z * velmult
                        + vec3<float>(0.f, velocity.y*velmult, 0.f);
}