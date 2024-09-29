import { Project, ProjectAddMutation } from "hornbeam-common/lib/app/projects";
import Form from "../widgets/Form";
import { useId, useState } from "react";
import ControlGroup from "../widgets/ControlGroup";
import Button from "../widgets/Button";
import ControlLabel from "../widgets/ControlLabel";
import Input from "../widgets/Input";
import LinkButton from "../widgets/LinkButton";

interface ProjectsViewProps {
  projects: ReadonlyArray<Project>;
  onProjectAdd: (mutation: Omit<ProjectAddMutation, "createdAt" | "id">) => Promise<void>;
  onProjectSelect: (projectId: string) => void;
}

export function ProjectsView(props: ProjectsViewProps) {
  const {projects, onProjectAdd, onProjectSelect} = props;

  const [addingProject, setAddingProject] = useState(false);

  if (addingProject) {
    return (
      <ProjectAddForm
        onClose={() => setAddingProject(false)}
        onProjectAdd={onProjectAdd}
      />
    );
  } else {
    return (
      <section>
        <ul>
          {projects.map(project => (
            <li key={project.id}>
              <LinkButton onClick={() => onProjectSelect(project.id)}>
                {project.name}
              </LinkButton>
            </li>
          ))}
        </ul>

        <ControlGroup>
          <Button
            intent="secondary"
            onClick={() => setAddingProject(true)}
            type="button"
          >
            Add project
          </Button>
        </ControlGroup>
      </section>
    );
  }
}

interface ProjectAddFormProps {
  onClose: () => void;
  onProjectAdd: (mutation: Omit<ProjectAddMutation, "createdAt" | "id">) => Promise<void>;
}

function ProjectAddForm(props: ProjectAddFormProps) {
  const {onClose, onProjectAdd} = props;

  // TODO: validation feedback

  const [name, setName] = useState("");
  const nameControlId = useId();

  async function handleSubmit() {
    if (name !== "") {
      await onProjectAdd({
        name: name,
      });
      onClose();
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      <ControlLabel htmlFor={nameControlId}>
        Name
      </ControlLabel>
      <ControlGroup>
        <Input
          autoFocus
          id={nameControlId}
          onChange={name => setName(name)}
          value={name}
        />
      </ControlGroup>

      <Form.MainButtons
        onCancel={onClose}
        submitText="Add project"
      />
    </Form>
  );
}
