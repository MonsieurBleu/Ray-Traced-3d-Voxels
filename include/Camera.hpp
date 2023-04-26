#ifndef CAMERA_HPP
#define CAMERA_HPP

#include <Vectors.hpp>

// float th = mouseUV.y*PI; // polar theta of direction
// float ph = mouseUV.x*PI; // polar phi of direaction
// dir = vec3(sin(th)*cos(ph), cos(th), sin(th)*sin(ph));

class camera
{
    private :
        vec3<float> Mouse_uv = vec3<float>(0.f);
        vec3<float> position = vec3<float>(0.f);
        vec3<float> direction = vec3<float>(1.f, 0.f, 0.f);
        float FOV = 1.5;
        float sensibility = 2.0;

    public :
        const vec3<float>* get_Mouse_uv()          {return &Mouse_uv;};
        const vec3<float>* get_position()          {return &position;};
        const vec3<float>* get_direction()         {return &direction;};
        const vec3<float>* get_updated_direction() {update_direction(); return &direction;};
        float get_FOV()                            {return FOV;};
        float get_sensibility()                    {return sensibility;};

        // Update the camera direction depending on mouse position onscreen
        void update_direction();

        // Apply given velocity to the camera position
        // velocity is expressed in unit/s
        void move(vec3<float> velocity);

        // Teleport the camera to the given position
        void teleport(vec3<float> newpos);
}


#endif